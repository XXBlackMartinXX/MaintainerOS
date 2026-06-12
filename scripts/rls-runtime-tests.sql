-- Runtime RLS allow/deny harness for MaintainerOS.
--
-- Usage: apply ALL files in supabase/migrations/ to a LOCAL Postgres
-- database first, then run this script with psql against the same DB.
-- See scripts/run-rls-runtime-tests.sh for the wrapper.
--
-- This script:
--   * seeds two deterministic test users (A, B) and two repos
--   * impersonates each user via set_config('request.jwt.claims', ...)
--     plus SET LOCAL ROLE authenticated, the same shape PostgREST uses
--   * asserts allow/deny for the invariants in docs/RLS_ACCESS_CONTROL.md
--   * raises an exception (non-zero psql exit) on the first failure
--
-- It is destructive to the target database (truncates public tables).
-- NEVER run it against a production database.

\set ON_ERROR_STOP on
\timing off

BEGIN;

-- Refuse to run if this looks like a production database (very best-effort).
DO $$
DECLARE
  db text := current_database();
BEGIN
  IF db NOT IN ('postgres', 'maintaineros_test', 'rls_test') THEN
    RAISE EXCEPTION 'Refusing to run RLS runtime tests against database "%". Use a local test DB named postgres / maintaineros_test / rls_test.', db;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------

-- Deterministic UUIDs so failures are reproducible.
\set user_a '11111111-1111-1111-1111-111111111111'
\set user_b '22222222-2222-2222-2222-222222222222'
\set repo_a '33333333-3333-3333-3333-333333333333'
\set repo_b '44444444-4444-4444-4444-444444444444'

-- Clean slate on public tables. We do NOT touch auth.users since this script
-- runs against a plain Postgres (no GoTrue). RLS reads auth.uid() from JWT
-- claims, not from auth.users, so we can simulate users by claims alone.
TRUNCATE TABLE
  public.github_publish_events,
  public.release_drafts,
  public.documentation_drafts,
  public.pull_request_ai_summaries,
  public.issue_triage_results,
  public.audit_logs,
  public.sync_jobs,
  public.labels,
  public.commits,
  public.contributors,
  public.pull_requests,
  public.issues,
  public.repositories,
  public.repository_memberships,
  public.settings,
  public.profiles
RESTART IDENTITY CASCADE;

-- user_github_tokens is service-role-only; truncate if it exists.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'user_github_tokens') THEN
    EXECUTE 'TRUNCATE TABLE public.user_github_tokens';
  END IF;
END $$;

-- Seed two profiles, two repos, and membership of user A in repo A only.
INSERT INTO public.profiles (id, github_login, github_id) VALUES
  (:'user_a'::uuid, 'user-a', '1001'),
  (:'user_b'::uuid, 'user-b', '1002');

INSERT INTO public.settings (user_id) VALUES
  (:'user_a'::uuid),
  (:'user_b'::uuid);

INSERT INTO public.repositories (id, github_id, owner, name, full_name) VALUES
  (:'repo_a'::uuid, 9001, 'org', 'repo-a', 'org/repo-a'),
  (:'repo_b'::uuid, 9002, 'org', 'repo-b', 'org/repo-b');

INSERT INTO public.repository_memberships (user_id, repository_id) VALUES
  (:'user_a'::uuid, :'repo_a'::uuid);

-- A seed issue in repo A (written as superuser; RLS only matters for the
-- authenticated role's reads/writes below).
INSERT INTO public.issues (repository_id, github_id, number, title, state)
VALUES (:'repo_a'::uuid, 5001, 1, 'seed', 'open');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Switch the current session to act as a specific user via JWT claims.
CREATE OR REPLACE FUNCTION pg_temp.act_as(_user uuid) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', _user::text, 'role', 'authenticated')::text,
    true
  );
  EXECUTE 'SET LOCAL ROLE authenticated';
END $$;

CREATE OR REPLACE FUNCTION pg_temp.act_as_anon() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '{}', true);
  EXECUTE 'SET LOCAL ROLE anon';
END $$;

CREATE OR REPLACE FUNCTION pg_temp.reset_role() RETURNS void
LANGUAGE plpgsql AS $$ BEGIN EXECUTE 'RESET ROLE'; END $$;

CREATE OR REPLACE FUNCTION pg_temp.assert(_cond boolean, _label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT _cond THEN
    RAISE EXCEPTION 'RLS RUNTIME ASSERT FAILED: %', _label;
  END IF;
  RAISE NOTICE 'ok  %', _label;
END $$;

-- ---------------------------------------------------------------------------
-- Tests
-- ---------------------------------------------------------------------------

-- U-1 / U-2: profiles + settings self isolation
DO $$
DECLARE n int;
BEGIN
  PERFORM pg_temp.act_as('11111111-1111-1111-1111-111111111111');

  SELECT count(*) INTO n FROM public.profiles;
  PERFORM pg_temp.assert(n = 1, 'U-1 user A sees only own profile');

  SELECT count(*) INTO n FROM public.settings;
  PERFORM pg_temp.assert(n = 1, 'U-1 user A sees only own settings');

  -- User B is invisible to A
  SELECT count(*) INTO n FROM public.profiles
    WHERE id = '22222222-2222-2222-2222-222222222222';
  PERFORM pg_temp.assert(n = 0, 'U-1 user A cannot read user B profile');

  -- Update on B's settings affects zero rows.
  UPDATE public.settings SET ai_tone = 'pwn'
    WHERE user_id = '22222222-2222-2222-2222-222222222222';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM pg_temp.assert(n = 0, 'U-2 user A cannot update user B settings');
END $$;

-- R-1: repo-scoped reads gated by membership
DO $$
DECLARE n int;
BEGIN
  PERFORM pg_temp.act_as('11111111-1111-1111-1111-111111111111');
  SELECT count(*) INTO n FROM public.repositories;
  PERFORM pg_temp.assert(n = 1, 'R-1 user A sees only repo A');
  SELECT count(*) INTO n FROM public.issues;
  PERFORM pg_temp.assert(n = 1, 'R-1 user A reads issues in repo A');

  PERFORM pg_temp.act_as('22222222-2222-2222-2222-222222222222');
  SELECT count(*) INTO n FROM public.repositories;
  PERFORM pg_temp.assert(n = 0, 'R-1 user B has no repo access');
  SELECT count(*) INTO n FROM public.issues;
  PERFORM pg_temp.assert(n = 0, 'R-1 user B cannot read repo A issues');
END $$;

-- R-2: draft insert requires self AND repo access
DO $$
DECLARE failed boolean;
BEGIN
  -- B cannot insert a draft into A's repo even with their own user_id.
  PERFORM pg_temp.act_as('22222222-2222-2222-2222-222222222222');
  failed := false;
  BEGIN
    INSERT INTO public.documentation_drafts (user_id, repository_id, kind, content, title)
    VALUES ('22222222-2222-2222-2222-222222222222',
            '33333333-3333-3333-3333-333333333333',
            'readme', 'x', 't');
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN failed := true;
  END;
  PERFORM pg_temp.assert(failed, 'R-2 user B cannot insert draft into repo A');

  -- B cannot insert as user A either.
  failed := false;
  BEGIN
    INSERT INTO public.documentation_drafts (user_id, repository_id, kind, content, title)
    VALUES ('11111111-1111-1111-1111-111111111111',
            '33333333-3333-3333-3333-333333333333',
            'readme', 'x', 't');
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN failed := true;
  END;
  PERFORM pg_temp.assert(failed, 'R-2 user B cannot impersonate user A');

  -- A can insert a draft for their own repo.
  PERFORM pg_temp.act_as('11111111-1111-1111-1111-111111111111');
  INSERT INTO public.documentation_drafts (user_id, repository_id, kind, content, title)
  VALUES ('11111111-1111-1111-1111-111111111111',
          '33333333-3333-3333-3333-333333333333',
          'readme', 'x', 't');
  PERFORM pg_temp.assert(true, 'R-2 user A can insert draft for own repo');
END $$;

-- D-1: draft tables reject UPDATE from authenticated role
DO $$
DECLARE n int;
BEGIN
  PERFORM pg_temp.act_as('11111111-1111-1111-1111-111111111111');
  UPDATE public.documentation_drafts SET approval_status = 'approved';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM pg_temp.assert(n = 0, 'D-1 documentation_drafts has no client UPDATE');

  UPDATE public.issue_triage_results SET approval_status = 'approved';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM pg_temp.assert(n = 0, 'D-1 issue_triage_results has no client UPDATE');

  UPDATE public.pull_request_ai_summaries SET approval_status = 'approved';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM pg_temp.assert(n = 0, 'D-1 pull_request_ai_summaries has no client UPDATE');

  UPDATE public.release_drafts SET approval_status = 'approved';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM pg_temp.assert(n = 0, 'D-1 release_drafts has no client UPDATE');
END $$;

-- D-2: github_publish_events is not insertable from authenticated
DO $$
DECLARE failed boolean := false;
BEGIN
  PERFORM pg_temp.act_as('11111111-1111-1111-1111-111111111111');
  BEGIN
    INSERT INTO public.github_publish_events (user_id, repository_id, target_kind, target_id, status)
    VALUES ('11111111-1111-1111-1111-111111111111',
            '33333333-3333-3333-3333-333333333333',
            'release', gen_random_uuid(), 'success');
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN failed := true;
  END;
  PERFORM pg_temp.assert(failed, 'D-2 github_publish_events rejects client INSERT');
END $$;

-- T-1: user_github_tokens has zero policies → authenticated reads return nothing
DO $$
DECLARE n int;
BEGIN
  PERFORM pg_temp.act_as('11111111-1111-1111-1111-111111111111');
  BEGIN
    SELECT count(*) INTO n FROM public.user_github_tokens;
    PERFORM pg_temp.assert(n = 0, 'T-1 user_github_tokens hidden from authenticated');
  EXCEPTION WHEN insufficient_privilege THEN
    PERFORM pg_temp.assert(true, 'T-1 user_github_tokens denied to authenticated');
  END;
END $$;

-- A-1: audit_logs append-only from user perspective
DO $$
DECLARE n int; failed boolean := false;
BEGIN
  PERFORM pg_temp.act_as('11111111-1111-1111-1111-111111111111');
  INSERT INTO public.audit_logs (user_id, action) VALUES
    ('11111111-1111-1111-1111-111111111111', 'test');
  UPDATE public.audit_logs SET action = 'tampered';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM pg_temp.assert(n = 0, 'A-1 audit_logs has no client UPDATE');
END $$;

PERFORM pg_temp.reset_role();

-- All assertions passed if we reach here.
DO $$ BEGIN RAISE NOTICE '== RLS RUNTIME TESTS PASSED =='; END $$;

ROLLBACK;
