# GitHub Integration

This document describes how MaintainerOS currently integrates with GitHub in
its **public-preview** form, and how that model is expected to evolve.

> **Scope.** MaintainerOS is not yet production-ready, and its GitHub
> integration is not yet least-privilege for every repository type. Evaluate
> the scopes below before connecting any sensitive repository.

## Current architecture (public-preview)

```
Browser ──► TanStack Start server fns ──► GitHub REST API
                       │
                       └──► Supabase (Postgres + Auth + RLS)
```

- **Auth.** GitHub OAuth via Supabase Auth. The OAuth App credentials
  (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) are configured in Supabase Auth
  → Providers → GitHub. They are never read from the application runtime.
- **Token storage.** When a user signs in, the Supabase `provider_token` and
  optional `provider_refresh_token` are persisted in `public.user_github_tokens`
  (one row per user) by `persistGithubToken`. RLS scopes the row to the owner.
- **Token use.** Tokens are loaded server-side only, via
  `loadUserGithubToken(userId)` inside server-function handlers. They are
  never exposed to the browser.
- **Repo sync.** `src/lib/github.functions.ts` exposes read-only server fns
  that paginate the GitHub REST API and upsert per-repository data into
  Supabase. Membership in `repository_memberships` controls who can read
  the synced rows via `has_repo_access()` RLS.
- **Writes.** Every write (issue comment, label apply, PR comment, draft
  release) goes through `src/lib/github-publish.functions.ts`. Every write
  requires:
  1. An AI draft in `approved` or `edited` state.
  2. A user click on a publish button.
  3. The `PublishConfirmDialog` confirmation showing the exact payload.
  4. A duplicate-protection check against `github_publish_events`.
  5. A row inserted into `audit_logs` capturing target id, source draft id,
     and outcome.
     Releases are always created with `draft: true`. Labels are only added,
     never removed.

## OAuth scopes

The current sign-in requests:

| Scope        | Why                                                                      |
| ------------ | ------------------------------------------------------------------------ |
| `read:user`  | Surface the maintainer's display name and avatar.                        |
| `user:email` | Identify the account for Supabase profile creation.                      |
| `repo`       | Read private repos, post comments, manage labels, create draft releases. |
| `read:org`   | Enumerate organization repositories the user maintains.                  |

`repo` is a broad scope: granting it to MaintainerOS gives the user's
OAuth session write access to every repository the user can write to. This
is the central reason the current model is **not** suitable for sensitive
repositories without explicit per-repository review.

A user who only needs read access to public repositories can sign in with
`public_repo` instead by reconfiguring the Supabase GitHub provider, at the
cost of losing private-repo support and most write actions.

## Read-only vs write-capable actions

| Action                      | Code path                                           | Write?           |
| --------------------------- | --------------------------------------------------- | ---------------- |
| List user repos             | `github.functions.ts → listMyRepos`                 | no               |
| Sync issues / PRs / commits | `github.functions.ts → syncRepository`              | no               |
| AI issue triage drafts      | `ai.functions.ts`                                   | no               |
| AI PR summary drafts        | `ai-pr.functions.ts`                                | no               |
| Post issue comment          | `github-publish.functions.ts → publishIssueComment` | yes              |
| Apply issue labels          | `github-publish.functions.ts → publishIssueLabels`  | yes              |
| Post PR comment             | `github-publish.functions.ts → publishPrSummary`    | yes              |
| Create draft release        | `github-publish.functions.ts → publishReleaseDraft` | yes (draft only) |

## Approval-gated publishing model

No write to GitHub is attempted without:

- A draft that the maintainer has clicked **Approve** on, and
- A second confirmation click in `PublishConfirmDialog`.

The duplicate-protection check returns `{ ok: false, alreadyPosted: true }`
unless the maintainer explicitly opts in to re-posting.

## Draft-only release behavior

`createRelease` always sets `draft: true` and `prerelease: false`. There is
no code path that publishes a non-draft release. This is intentional and
must remain true.

## Audit logging

Every write attempt — success or failure — inserts one row into
`public.audit_logs` and one row into `public.github_publish_events`. The
audit row stores the user id, action verb (`github.issue_comment.attempted`,
`github.issue_comment.success`, etc.), the target type/id, and a small
metadata blob. Secrets and tokens are never written to the log.

## Known limitations (public-preview)

- **Broad OAuth scope.** `repo` grants write access to every repository the
  signed-in user can write to. There is no per-repository scoping today.
- **No GitHub App.** There is no installation model and no fine-grained
  permission selection. See `docs/GITHUB_APP_MIGRATION_PLAN.md`.
- **No webhook receiver.** Repo state is refreshed by sync, not events.
- **No live GitHub integration tests.** Tests cover pure logic only.
- **Rate limits.** The REST client surfaces 403/429 with reset time but does
  not yet pause syncs proactively.

## Future GitHub App model

A GitHub App with per-repository installation, fine-grained permissions, and
webhook events is the intended direction. See
`docs/GITHUB_APP_MIGRATION_PLAN.md` for the plan. Until that lands:

- Treat the current model as suitable for **personal and public projects
  only**.
- Do not connect repositories that contain customer data, production
  secrets, or material non-public information.

## Manual owner setup tasks

- Configure GitHub OAuth provider in Supabase Auth (callback URL,
  client id, client secret).
- Decide and document the minimum scopes acceptable for your installation.
- Enable GitHub private vulnerability reporting on the public repo.
- (Future) Create the GitHub App per `GITHUB_APP_MIGRATION_PLAN.md`.

## Security notes

- Tokens are server-only. They are not sent to the browser, not logged, and
  not echoed in audit metadata.
- All publishing paths re-check `has_repo_access` before calling GitHub.
- All write paths verify the draft is `approved` or `edited` before sending.
- Releases are draft-only by construction.
- The OAuth provider configuration lives in Supabase, not in the app
  bundle.
