# RLS Test Plan

Static policy structure is asserted in `src/lib/security/rls-policy-checks.test.ts` and runs in CI via `bun run test`. Static checks parse `supabase/migrations/` and verify the invariants in `docs/RLS_ACCESS_CONTROL.md`. They are NOT a substitute for runtime verification.

This document describes the runtime test plan for the access-control invariants.

## Status

- **Option A (live local Postgres / Supabase RLS integration tests):** not implemented in CI for Phase P2. The current CI is a single `bun` job and does not provision Postgres or `supabase start`. Adding a Docker-Compose / Supabase CLI matrix is tracked as a future improvement (see "Future work" below).
- **Option B (static policy assertions):** implemented. See `src/lib/security/rls-policy-checks.ts`.
- **Option C (manual checklist):** this document.

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
