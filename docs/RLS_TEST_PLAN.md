# RLS Test Plan

Static policy structure is asserted in `src/lib/security/rls-policy-checks.test.ts` and runs in CI via `bun run test`. Static checks parse `supabase/migrations/` and verify the invariants in `docs/RLS_ACCESS_CONTROL.md`. They are NOT a substitute for runtime verification.

This document describes the runtime test plan for the access-control invariants.

## Status (Phase P8)

- **Option A (full local Supabase stack with GoTrue):** not implemented. Supabase CLI is not installed in CI; adding it would require Docker-in-Docker on the Bun runner. Tracked under "Future work".
- **Option B (Postgres-only runtime RLS harness with simulated JWT claims):** **implemented as an owner-run / CI-optional command.** See `scripts/rls-runtime-tests.sql` and `scripts/run-rls-runtime-tests.sh`. Not wired into required CI because it needs a local Postgres service container that the current Bun-only CI does not provision.
- **Static policy assertions:** implemented and required in CI (`bun run check:rls` + `src/lib/security/rls-policy-checks.test.ts`).
- **Manual checklist:** still listed below as a fallback when no local DB is available.

## Running the runtime harness (Option B)

Requirements: a local Postgres 14+ database the owner controls. Do NOT point it at production.

```bash
# Throwaway local Postgres
docker run --rm -d --name rls-pg -e POSTGRES_PASSWORD=postgres \
  -p 54329:5432 postgres:15
export DATABASE_URL=postgres://postgres:postgres@localhost:54329/postgres

# Apply migrations + seed fixtures + run allow/deny assertions
bun run test:rls:runtime
```

The harness:

1. Creates the `anon` / `authenticated` / `service_role` roles and a stub `auth.uid()` reading `request.jwt.claims->>'sub'`.
2. Applies every `supabase/migrations/*.sql` in order.
3. Seeds two deterministic users (A, B) and two repos, with A a member of repo A only.
4. Impersonates each user via `set_config('request.jwt.claims', …)` + `SET LOCAL ROLE authenticated` (the same pattern PostgREST uses).
5. Asserts allow/deny for invariants U-1, U-2, R-1, R-2, D-1, D-2, T-1, A-1. Any failure raises and exits non-zero.
6. Wraps everything in `BEGIN … ROLLBACK` so the target database is left clean.

The script refuses to run if `DATABASE_URL` looks like a managed/production host, and SQL refuses if the database name is not one of `postgres` / `maintaineros_test` / `rls_test`.

## What the harness does NOT cover

- GoTrue / Supabase Auth flows — `auth.users` rows, password/OAuth login, refresh tokens. We simulate claims directly.
- Service-role bypass behavior end-to-end — exercised by server-function unit tests, not here.
- PostgREST-level response shapes (e.g. error codes vs empty arrays). The harness uses raw psql semantics; observed behavior is allow / deny / 0 rows updated.
- Live production database verification.
- Any formal external security audit.



## Manual runtime verification checklist

These checks require two authenticated test users (User A, User B) and at least one repo connected by User A only.

For each row, expected behavior is "denied" via PostgREST returning `[]` (RLS hides the row) or a permission error.

### User isolation

- [ ] User B `select * from profiles where id = <UserA.id>` → returns no rows.
- [ ] User B `update settings set ai_tone='x' where user_id = <UserA.id>` → 0 rows updated.
- [ ] User B `select * from audit_logs where user_id = <UserA.id>` → returns no rows.
- [ ] User B `select * from sync_jobs where user_id = <UserA.id>` → returns no rows.
- [ ] User B `select * from github_publish_events where user_id = <UserA.id>` → returns no rows.

### Repo isolation

- [ ] User B `select * from repositories where id = <UserA.repo>` → returns no rows.
- [ ] User B `select * from issues where repository_id = <UserA.repo>` → returns no rows.
- [ ] User B `select * from pull_requests where repository_id = <UserA.repo>` → returns no rows.
- [ ] User B `select * from commits / contributors / labels where repository_id = <UserA.repo>` → returns no rows.
- [ ] User B `insert into issue_triage_results (..., repository_id = <UserA.repo>, user_id = <UserB.id>)` → denied (fails `has_repo_access` check).
- [ ] User B `insert into documentation_drafts` for UserA's repo → denied.
- [ ] User B `insert into pull_request_ai_summaries` for UserA's repo → denied.
- [ ] User B `insert into release_drafts` for UserA's repo → denied.

### Draft tables — no client-side approval

- [ ] User A `update issue_triage_results set approval_status='approved'` directly via PostgREST → denied (no UPDATE policy).
- [ ] Same for `documentation_drafts`, `pull_request_ai_summaries`, `release_drafts`.
- [ ] Approval succeeds only via the server function (which uses the service-role client + ownership check).

### Token isolation

- [ ] User A `select * from user_github_tokens` (authenticated PostgREST) → empty / permission denied.
- [ ] User B same as above → empty / permission denied.
- [ ] Any server function that returns token-related data never includes `access_token` or `refresh_token` in its response payload (grep + manual review).

### Publish events

- [ ] User A `insert into github_publish_events (...)` via authenticated PostgREST → denied (no INSERT policy).
- [ ] Events appear only after a server-mediated approve-then-publish flow.

## How to run manually

1. In the Supabase project, create two test users via the Auth admin tool, or sign in twice locally with different GitHub accounts.
2. Note their `auth.uid()` values.
3. Use the Supabase SQL editor with `set local role authenticated; set local "request.jwt.claims" = '{"sub":"<user_id>","role":"authenticated"}';` and run each query above.
4. Record results in a per-release verification log.

## Future work — Option A

A future phase should add:

- A `docker-compose.yml` (or Supabase CLI) bringing up Postgres + PostgREST + GoTrue.
- A `tests/rls/` suite running through `@supabase/supabase-js` with two anon JWTs signed using the local Auth secret.
- A CI job gated to non-PRs from forks (to avoid leaking the local-only JWT secret to forks).
- Coverage for every invariant in `docs/RLS_ACCESS_CONTROL.md`.

This is tracked in `docs/PRODUCTION_CHECKLIST.md` under Phase P2 follow-ups.
