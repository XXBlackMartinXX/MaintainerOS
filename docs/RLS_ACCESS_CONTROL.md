# RLS and Database Access Control

This document is the source of truth for MaintainerOS's database access-control model. It is co-maintained with the SQL migrations under `supabase/migrations/` and the static policy checks under `src/lib/security/rls-policy-checks.ts`.

> **Scope:** this is documentation and statically-verified policy structure. It does not constitute a formal security audit, and static checks are not a substitute for runtime RLS verification. See `docs/RLS_TEST_PLAN.md` for the runtime test plan.

## 1. Access-control invariants

These invariants MUST hold. They are enforced by RLS policies and/or server-function logic, and a subset is asserted by the static policy checks.

### User isolation

1. **U-1** A user can read only their own row in `profiles` and `settings`.
2. **U-2** A user cannot update another user's `profiles` or `settings` row.
3. **U-3** A user can read only their own rows in `sync_jobs`, `audit_logs`, and `github_publish_events`.

### Repo isolation

1. **R-1** A user can read repo-scoped catalog rows (`repositories`, `issues`, `pull_requests`, `labels`, `commits`, `contributors`) only if they are a member of the repository (`has_repo_access(auth.uid(), repository_id) = true`).
2. **R-2** A user can insert AI draft rows (`issue_triage_results`, `pull_request_ai_summaries`, `documentation_drafts`, `release_drafts`) only when both `auth.uid() = user_id` AND `has_repo_access(auth.uid(), repository_id)` hold.
3. **R-3** Repo-scoped catalog tables have no user-facing INSERT/UPDATE/DELETE policies. Writes happen exclusively via server functions using the service-role admin client after explicit access checks.

### Token isolation

1. **T-1** `user_github_tokens` has RLS enabled and **no** policies granted to `authenticated` or `anon`. Only the service-role client can read or write it.
2. **T-2** No server function returns token values to the browser. Token presence is exposed only as boolean / scopes-string flags.

### Write safety on draft tables

1. **D-1** Draft tables (`issue_triage_results`, `pull_request_ai_summaries`, `documentation_drafts`, `release_drafts`) have **no user-facing UPDATE policies**. Updates (including `approval_status = 'approved'`) flow exclusively through server functions using the service-role client with an explicit `.eq('user_id', userId)` ownership check.
2. **D-2** `github_publish_events` has **no user-facing INSERT policy**. All publish events are written by the service role after the approval + confirm flow.

### Audit and sync writes

1. **A-1** `audit_logs` has a self-INSERT policy but no UPDATE/DELETE — entries are append-only from the user's perspective. Server functions can additionally write via the service-role client.
2. **A-2** `sync_jobs` has only a self-SELECT policy. All writes are service-role-only from inside the sync server functions.

### Permissive-policy ban

1. **P-1** No policy in `public` uses `USING (true)` or `WITH CHECK (true)` except where explicitly documented and reviewed (currently: none).

## 2. Table inventory

| Table                       | Purpose                             | Scope       | RLS | SELECT | INSERT               | UPDATE | DELETE | Service-role-only writes    | Risk                 |
| --------------------------- | ----------------------------------- | ----------- | --- | ------ | -------------------- | ------ | ------ | --------------------------- | -------------------- |
| `profiles`                  | User profile (github login, avatar) | self        | on  | self   | self                 | self   | —      | sign-up trigger             | Low                  |
| `settings`                  | Per-user app settings               | self        | on  | self   | self (via `FOR ALL`) | self   | self   | —                           | Low                  |
| `repository_memberships`    | Link user → repo                    | self        | on  | self   | —                    | —      | —      | server (connect/disconnect) | Low                  |
| `repositories`              | Repo catalog                        | repo        | on  | member | —                    | —      | —      | yes (sync)                  | Low                  |
| `issues`                    | Issue catalog                       | repo        | on  | member | —                    | —      | —      | yes (sync)                  | Low                  |
| `pull_requests`             | PR catalog                          | repo        | on  | member | —                    | —      | —      | yes (sync)                  | Low                  |
| `commits`                   | Commit catalog                      | repo        | on  | member | —                    | —      | —      | yes (sync)                  | Low                  |
| `contributors`              | Contributor list                    | repo        | on  | member | —                    | —      | —      | yes (sync)                  | Low                  |
| `labels`                    | Label catalog                       | repo        | on  | member | —                    | —      | —      | yes (sync)                  | Low                  |
| `sync_jobs`                 | Sync run records                    | self+repo   | on  | self   | —                    | —      | —      | yes (sync)                  | Low                  |
| `issue_triage_results`      | AI issue triage drafts              | self+repo   | on  | self   | self+member          | —      | self   | yes (approval/update)       | Low                  |
| `pull_request_ai_summaries` | AI PR summaries                     | self+repo   | on  | self   | self+member          | —      | self   | yes (approval/update)       | Low                  |
| `documentation_drafts`      | AI docs drafts                      | self+repo   | on  | self   | self+member          | —      | self   | yes (approval/update)       | Low                  |
| `release_drafts`            | AI release notes drafts             | self+repo   | on  | self   | self+member          | —      | self   | yes (approval/update)       | Low                  |
| `github_publish_events`     | GitHub publish audit trail          | self        | on  | self   | —                    | —      | —      | yes (publish flow)          | Low                  |
| `audit_logs`                | Per-user audit                      | self        | on  | self   | self                 | —      | —      | yes (server writes)         | Low                  |
| `user_github_tokens`        | OAuth tokens                        | server-only | on  | —      | —                    | —      | —      | yes (token exchange)        | Medium (token store) |

Legend: **self** = `auth.uid() = user_id` (or `id`); **member** = `has_repo_access(auth.uid(), repository_id)`; **self+member** = both. A dash means no policy of that type is granted to `authenticated`.

## 3. Helper functions and triggers

- `public.has_repo_access(uuid, uuid)` — `security definer`, `stable`, `search_path = public`. Execute is revoked from `public`, `anon`, `authenticated` (callable only from RLS expressions, which run as the policy owner). Avoids RLS recursion on `repository_memberships`.
- `public.handle_new_user()` — `security definer` trigger on `auth.users` insert; creates default `profiles` + `settings` rows.
- `public.touch_updated_at()` — `updated_at` maintenance trigger on draft tables.

## 4. What is verified, what is not

| Check                                               | How                                                          |
| --------------------------------------------------- | ------------------------------------------------------------ |
| RLS enabled on every `public` table                 | static check (`rls-policy-checks.test.ts`) + Supabase linter |
| Required policy shapes match the invariants above   | static check                                                 |
| No `USING (true)` / `WITH CHECK (true)` policy      | static check                                                 |
| `user_github_tokens` has zero policies              | static check                                                 |
| Draft tables have no UPDATE policy                  | static check                                                 |
| `github_publish_events` has no INSERT policy        | static check                                                 |
| Runtime allow/deny behavior with real auth sessions | manual / future — see `docs/RLS_TEST_PLAN.md`                |
| Service-role server code never returns token values | manual code review + grep checks                             |

Static checks parse the migrations under `supabase/migrations/`. They guard against accidental regressions during migration edits but cannot prove runtime behavior; that requires a live Postgres + Supabase Auth, covered by the test plan.
