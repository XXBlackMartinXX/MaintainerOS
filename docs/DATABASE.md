# Database

MaintainerOS uses Supabase Postgres (via the backend (Supabase)). All app data lives in the `public` schema; auth lives in the managed `auth` schema (do not modify).

## Tables (public schema)

| Table | Purpose | Scope |
| --- | --- | --- |
| `profiles` | Lightweight per-user profile mirror | Per-user (self) |
| `settings` | UI preferences (tone, sensitivity, …) | Per-user (self) |
| `repositories` | Repo metadata synced from GitHub | Per-repo (members) |
| `repository_memberships` | Maps `user_id` ↔ `repository_id` and role | Per-user (self) |
| `user_github_tokens` | Cached GitHub OAuth tokens | Per-user (service-role only) |
| `sync_jobs` | History of repo sync runs | Per-user (self) |
| `issues` | Synced GitHub issues | Per-repo (members) |
| `pull_requests` | Synced GitHub pull requests | Per-repo (members) |
| `labels` | Synced GitHub labels | Per-repo (members) |
| `commits` | Synced GitHub commits | Per-repo (members) |
| `contributors` | Synced GitHub contributors | Per-repo (members) |
| `issue_triage_results` | AI triage drafts | Per-user (self) |
| `pull_request_ai_summaries` | AI PR summaries | Per-user (self) |
| `release_drafts` | AI changelog / release-note drafts | Per-user (self) |
| `documentation_drafts` | AI documentation drafts | Per-user (self) |
| `github_publish_events` | Record of every GitHub write attempt | Per-user (self) |
| `audit_logs` | Generic audit trail for AI / publish / settings | Per-user (self) |

See `supabase/migrations/` for the full schema history.

## Functions

| Function | Purpose |
| --- | --- |
| `has_repo_access(_user_id, _repo_id)` | Security-definer helper used by RLS policies on per-repo tables |
| `handle_new_user()` | Triggered on `auth.users` insert; seeds `profiles` and `settings` |
| `touch_updated_at()` | Trigger function for `updated_at` columns |

## Applying migrations

Migrations live in `supabase/migrations/` and run automatically in the backend (Supabase). To apply them manually against a local Supabase project:

```bash
supabase db push
```

## Seeding demo data

MaintainerOS uses **client-side demo mode** (no database seeding). Toggle demo mode from the landing-page "Try demo" button or Settings → Demo mode. Demo data never touches Postgres.

## Common errors

- **`new row violates row-level security policy`** — the row is missing a `user_id` matching `auth.uid()`. Make sure inserts set `user_id` to the signed-in user.
- **Empty result, no error** — RLS filtered all rows. Confirm the user is a member of the repository in `repository_memberships`.
- **`relation does not exist`** — migration not applied. Run the latest migration.
