# GitHub App Migration Plan (Future)

This plan describes how MaintainerOS would move from the current OAuth-only
model to a **GitHub App** model with per-repository installation and
least-privilege permissions. **Nothing in this plan is implemented yet.**
Only safe scaffolding (env detection + setup booleans) exists.

## Why a GitHub App

The current `repo` OAuth scope is broad: it grants write access to every
repository the signed-in user can write to. A GitHub App lets the
maintainer install MaintainerOS on **specific** repositories with
**specific** permissions, and gives the app its own short-lived tokens
that are not tied to a human user's broad GitHub privileges.

Concretely, a GitHub App lets us:

- Limit access to a chosen set of repositories per installation.
- Pick fine-grained permissions per resource (issues, pull requests,
  contents, metadata, releases).
- Receive webhook events instead of polling.
- Rotate credentials independently of any maintainer's session.

## Proposed permissions

| Permission    | Level | Why                                     |
| ------------- | ----- | --------------------------------------- |
| Metadata      | Read  | Required by every App.                  |
| Contents      | Read  | Default branch, files used for docs/AI. |
| Issues        | Write | Post AI-drafted comments, apply labels. |
| Pull requests | Write | Post AI-drafted PR review comments.     |
| Releases      | Write | Create **draft** releases only.         |
| Members (org) | Read  | Show org repo lists.                    |

Repositories: **selected repositories only** — never "All repositories"
by default. We will document this prominently in the install flow.

## Proposed webhook events

- `issues` (opened, edited, labeled, closed)
- `pull_request` (opened, edited, closed, ready_for_review)
- `pull_request_review` (submitted)
- `release` (published)
- `installation` and `installation_repositories` (lifecycle)

A receiver would live at `src/routes/api/public/webhooks/github.ts` and
verify `x-hub-signature-256` with `GITHUB_APP_WEBHOOK_SECRET` before any
write.

## Proposed installation flow

1. Maintainer clicks **Install GitHub App** in MaintainerOS.
2. Browser is redirected to `https://github.com/apps/<app-slug>/installations/new`.
3. GitHub returns to a TanStack server route with `installation_id` and
   `setup_action`.
4. Server exchanges the installation id for an installation access token
   (short-lived, ~1 hour) using the app's private key signed JWT.
5. Selected repositories are upserted into `repositories` and
   `repository_memberships` for the installing user.
6. Webhook deliveries begin.

## Token exchange and storage

- We **do not** store installation access tokens at rest. They are minted
  on demand from `GITHUB_APP_ID` + `GITHUB_APP_PRIVATE_KEY` + the
  installation id, and held in memory for the duration of a single
  server-fn call.
- A new table `public.github_app_installations` would store:
  `id`, `installation_id`, `account_login`, `account_type`,
  `target_user_id`, `created_at`, `suspended_at`.
- `user_github_tokens` remains for legacy OAuth users until the migration
  is complete, then is deprecated.

## Required env vars (future)

- `GITHUB_APP_ID`
- `GITHUB_APP_PRIVATE_KEY` (PEM, server only — never exposed)
- `GITHUB_APP_CLIENT_ID`
- `GITHUB_APP_CLIENT_SECRET`
- `GITHUB_APP_WEBHOOK_SECRET`

These are already detected by `src/lib/env.ts` and surfaced as booleans by
`getServerConfigStatus`. Their absence MUST NOT break the current OAuth
flow. No runtime path consumes them yet.

## Required owner setup steps (future, manual)

1. Create the GitHub App at <https://github.com/settings/apps/new>.
2. Set permissions as listed above. Choose "Only on this account" or
   "Any account" based on distribution plans.
3. Configure the webhook URL to
   `https://<your-host>/api/public/webhooks/github`.
4. Generate and download the private key (`.pem`).
5. Add the five env vars listed above to Lovable Cloud secrets.
6. Install the App on the repositories that should be available in
   MaintainerOS.

## Migration risks

- **Dual-path complexity.** OAuth and App must coexist during rollout.
- **Permission drift.** Adding a new write feature later requires bumping
  App permissions, which forces each installer to re-accept.
- **Webhook delivery gaps.** A missed delivery means a stale repo until
  the next sync.
- **Private key handling.** The PEM is high-value; rotation and storage
  must be explicit.

## Rollback plan

- Feature flag the App-based code paths behind `hasFeature("github-app")`.
- If a regression occurs, set the relevant env vars to empty in the
  deployment to fall back to the OAuth code paths.
- Keep `user_github_tokens` for at least one minor version after the App
  becomes the default.

## Invariants that must NOT change during migration

- Every GitHub write still requires an approved AI draft.
- Every GitHub write still goes through `PublishConfirmDialog`.
- Releases are still draft-only.
- Audit log rows are still written for every attempt.
- Demo mode still functions without any GitHub credentials.
- The browser never sees tokens, installation ids excluded — installation
  ids are not secret, but treat them as configuration, not as data.

## Status

**Plan only.** No GitHub App code paths exist. Env detection is the only
scaffolding present today.
