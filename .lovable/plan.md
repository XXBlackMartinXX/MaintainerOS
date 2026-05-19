# Slice 2 — Live GitHub OAuth + Repository Sync

Goal: turn the polished shell into a real working foundation. Auth, DB, sync, and live data — no AI yet.

## 1. Enable Lovable Cloud

Enable Cloud so we get Supabase auth, Postgres, and server-side env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`). This is a prerequisite for everything below.

## 2. GitHub OAuth (Supabase provider)

- Use Supabase Auth `signInWithOAuth({ provider: 'github', scopes: 'read:user user:email repo read:org' })`.
- Persist `provider_token` (GitHub access token) on the server in `user_github_tokens` (service-role only, never sent to browser).
- Add `/login` route + `/auth/callback` route that captures `provider_token`/`provider_refresh_token` from the session and POSTs to a server fn that stores it server-side.
- Add `_authenticated` pathless layout route. Move `app.*` routes under it. `beforeLoad` checks session and redirects to `/login`.
- First-time users (no row in `profiles` or no connected repos) redirect to `/onboarding`.

Required secret: `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` are configured in the Supabase dashboard's GitHub provider — not in our env (we'll document this).

## 3. Database schema (migrations)

```
profiles            (id PK→auth.users, github_login, github_id, avatar_url, email, created_at)
user_github_tokens  (user_id PK, access_token, refresh_token, scopes, updated_at)   -- service-role only
repositories        (id PK, github_id UNIQUE, owner, name, full_name, description,
                     stars, forks, primary_language, visibility, open_issues, pushed_at,
                     default_branch, html_url, updated_at)
repository_memberships (user_id, repository_id, role, connected_at, PK(user_id, repo_id))
issues              (id PK, repository_id, github_id, number, title, state, author_login,
                     author_avatar, labels jsonb, comments, created_at, updated_at, closed_at, body)
pull_requests       (id PK, repository_id, github_id, number, title, state, author_login,
                     additions, deletions, changed_files, draft, merged_at, created_at, updated_at, body)
contributors        (repository_id, login, avatar_url, contributions, PK(repo_id, login))
labels              (repository_id, name, color, description, PK(repo_id, name))
commits             (id PK, repository_id, sha, author_login, message, committed_at)
sync_jobs           (id PK, repository_id, user_id, status, started_at, finished_at,
                     issues_synced, prs_synced, contributors_synced, error)
audit_logs          (id PK, user_id, action, target_type, target_id, metadata jsonb, created_at)
settings            (user_id PK, ai_tone, security_sensitivity, auto_changelog, prefs jsonb)
```

RLS:
- `profiles`, `settings`, `repository_memberships`, `sync_jobs`, `audit_logs`: user can read/write their own rows.
- `repositories`, `issues`, `pull_requests`, `contributors`, `labels`, `commits`: readable only if user has a membership row for that `repository_id`.
- `user_github_tokens`: NO policies — accessed only via service role on the server.

Trigger: on `auth.users` insert → create `profiles` row from GitHub identity data.

## 4. GitHub API service layer

`src/lib/github/*.server.ts` (server-only, `*.server` so import-protection blocks client bundles):

- `client.server.ts` — typed fetch wrapper with auth header, JSON parsing, rate-limit headers, 403/429 backoff, abortable, paginated `paginate()` iterator following `Link` headers.
- `repos.server.ts`, `issues.server.ts`, `pulls.server.ts`, `contributors.server.ts`, `labels.server.ts`, `commits.server.ts` — typed endpoint wrappers.
- All take an `accessToken` arg; never read tokens at module scope.

`src/lib/github/*.functions.ts` (thin `createServerFn` declarations only):

- `listMyRepos` — fetches `/user/repos?sort=updated`, paginated, returns DTOs.
- `connectRepositories({ repoIds })` — upserts `repositories` + creates `repository_memberships` + writes `audit_logs`.
- `disconnectRepository({ repoId })`.
- `listConnectedRepos` — returns the user's connected repos for the selector.
- `syncRepository({ repoId })` — runs a sync job: creates `sync_jobs` row, fetches issues/PRs/contributors/labels/commits in parallel with pagination caps (e.g. 200 issues, 100 PRs, 100 contribs, 50 commits), upserts into tables, updates `sync_jobs` with counts + status, writes audit log. Errors caught and stored in `sync_jobs.error`.
- `getSyncStatus({ repoId })` — latest job + counts.

Auth model: all functions use `requireSupabaseAuth` middleware, then load the GitHub token from `user_github_tokens` via the admin client.

## 5. UI changes

- `/login` — minimal "Continue with GitHub" page.
- `/auth/callback` — handles session, persists token via server fn, routes to `/onboarding` (first time) or `/app`.
- `/onboarding` — step 2 ("Choose repositories") now lists real repos from `listMyRepos` with checkboxes; step 4 submit calls `connectRepositories`.
- `RepoSelector` — driven by `listConnectedRepos` via `useQuery`; persisted active repo via context + localStorage.
- New `SyncStatusPanel` component on the dashboard + on `/app/health` — shows last sync, counts, errors, "Sync now" button calling `syncRepository`.
- Each data-driven page (`/app/issues`, `/app/pulls`, `/app/contributors`, `/app/health`) reads from Supabase tables filtered by active `repository_id`. If the repo has never been synced, show an empty state with "Sync now". Pages without live data yet (changelog, moderation, roadmap, docs, security, actions) keep their current content with a clearly visible `Demo data` badge already in `ui-bits`.
- Loading / empty / error states everywhere via `useQuery` + skeletons.

## 6. Routing changes

```
src/routes/
  __root.tsx                          (unchanged shell)
  index.tsx                           (landing)
  login.tsx                           (new)
  auth.callback.tsx                   (new)
  _authenticated.tsx                  (new — gate)
  _authenticated/onboarding.tsx       (moved)
  _authenticated/app.tsx              (moved layout)
  _authenticated/app.*.tsx            (moved pages)
```

The `_authenticated` `beforeLoad` calls `supabase.auth.getUser()` and redirects to `/login`. Loaders use `useQuery` + `useServerFn` (no protected calls in loaders — avoids prerender 401).

## 7. Security

- Tokens only in `user_github_tokens`, never returned by any server fn, never logged.
- Every server fn validates input with Zod.
- All cross-user data access goes through `requireSupabaseAuth` so RLS applies.
- `audit_logs` writes on: oauth login, repo connect/disconnect, sync start/finish.
- Rate-limit aware: if GitHub returns 403 with `X-RateLimit-Remaining: 0`, surface a clear error including reset time.

## 8. Docs

Update `README.md` + `.env.example` with:
- Lovable Cloud auto-provisions Supabase; no manual setup needed in dev.
- Self-host: enable GitHub provider in Supabase Auth, set callback URL to `<SUPABASE_URL>/auth/v1/callback`, list required scopes.
- Migration files live in `supabase/migrations/`.
- Sync model: pagination caps, what's synced, what isn't.
- Clearly mark which pages are live vs demo.

## 9. Out of scope (next slice)

- Real AI triage (Lovable AI Gateway) — stays stubbed.
- GitHub webhooks (`/api/public/github`) — stubbed in roadmap only.
- Posting back to GitHub (issue replies, labels) — UI shows drafts, no write API yet.

## Build order

1. Enable Cloud → migration for all tables + RLS + trigger.
2. Auth: `/login`, `/auth/callback`, `_authenticated` gate, token persistence server fn.
3. GitHub service layer + `listMyRepos` + `connectRepositories`.
4. Onboarding rewired to live repos.
5. `RepoSelector` + active-repo context.
6. `syncRepository` + sync status UI.
7. Wire `/app/issues`, `/app/pulls`, `/app/contributors`, `/app/health` to live data; demo-label the rest.
8. README + `.env.example` updates.

I'll quietly fix the small landing-page hydration mismatch (random number in HeroPreview) along the way.
