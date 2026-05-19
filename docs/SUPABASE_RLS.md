# Supabase Row-Level Security

Every user-data table in MaintainerOS has RLS enabled. There are two scoping models:

## 1. Self-scoped tables

Rows are visible only to the user that owns them (`auth.uid() = user_id` or `auth.uid() = id`).

- `profiles`
- `settings`
- `repository_memberships`
- `sync_jobs`
- `issue_triage_results`
- `pull_request_ai_summaries`
- `release_drafts`
- `documentation_drafts`
- `github_publish_events`
- `audit_logs`

Insert policies require `with check (auth.uid() = user_id)`; reads, updates, deletes use the matching `using` clause.

## 2. Repository-scoped tables

Rows are visible to any user who is a member of the repository in `repository_memberships`. Access is checked via the security-definer helper `has_repo_access(auth.uid(), repository_id)`.

- `repositories` (uses `has_repo_access(auth.uid(), id)`)
- `issues`
- `pull_requests`
- `labels`
- `commits`
- `contributors`

These tables are **read-only** to authenticated users; writes happen exclusively through server functions using the service-role admin client after access checks.

## 3. Service-role-only tables

- `user_github_tokens` — no policies granted to authenticated users. Only the service-role admin client can read or write.

## Verifying RLS is enabled

In the Supabase database tab, every table must show "RLS enabled". The included `supabase--linter` tool also flags any table missing RLS.

## Common patterns

```sql
-- self-scoped read
create policy "rows self read" on public.<table>
  for select using (auth.uid() = user_id);

-- self-scoped insert
create policy "rows self insert" on public.<table>
  for insert with check (auth.uid() = user_id);

-- repo-scoped read
create policy "<table> read if member" on public.<table>
  for select using (has_repo_access(auth.uid(), repository_id));
```

## Pitfalls

- Forgetting `with check` on inserts → silent insert failures.
- Allowing `update` without re-checking `auth.uid() = user_id` → privilege escalation.
- Using `auth.users` directly in policies — always go through `profiles` or `repository_memberships`.
- Reusing the publishable key on the server — RLS still applies, which is what you want for user-scoped operations. Only switch to the service-role key inside server code that intentionally bypasses RLS.
