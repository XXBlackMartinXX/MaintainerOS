# MaintainerOS

MaintainerOS is an open-source operations dashboard for GitHub maintainers. It
helps with issue triage, pull request summaries, changelog drafts,
documentation drafts, repository readiness checks, and approval-gated GitHub
publishing.

## Status

Initial public preview. MaintainerOS is pre-1.0 and should be tested on
non-critical repositories first. The project does not claim production
adoption, stars, downloads, or paying users.

> This repository is an **application**, not an npm package. `package.json`
> is marked `"private": true` so it cannot be accidentally published to a
> registry. Clone and run it locally or deploy it to your own host.

## Features

- GitHub OAuth and on-demand repository sync (issues, PRs, contributors,
  labels, releases)
- AI-assisted issue triage drafts (type, severity, priority, suggested
  labels, suggested reply)
- AI-assisted pull request summary drafts with risk and breaking-change
  signals
- Changelog and release-note drafts grouped by Added / Changed / Fixed
- Documentation draft generator (README suggestions, CONTRIBUTING, SECURITY,
  CODE_OF_CONDUCT, issue / PR templates, maintainer and release guides)
- Repository health and open-source readiness checks
- Security readiness signals with cautious, evidence-based badges
- Approval-gated GitHub write actions: issue comments, label apply, PR
  comments, draft releases
- AI Action Log and full audit trail
- Demo mode with clearly-labeled sample data

## Safety model

MaintainerOS is built to assist maintainers, not to act on their behalf.

- Every AI output is an editable **draft**. Nothing is generated and posted
  in one step.
- No automatic posting to GitHub. Each publish requires an approved draft,
  an explicit click, and a confirmation dialog with a preview.
- No automatic label application. Labels are pre-selected from the
  repository's existing labels and remain editable until you confirm.
- Releases are created with `draft: true` server-side. MaintainerOS never
  publishes a non-draft release.
- Duplicate-post protection checks prior publish events for the same target
  and requires explicit re-confirmation for re-posts.
- Every AI action and every publish attempt is written to the audit log,
  including model, target, status, and any sanitised error message.
- MaintainerOS does not fabricate stars, downloads, users, contributors, or
  activity. Cautious labels (`Live data`, `Partial data`, `Demo data`,
  `AI draft`) are used everywhere data confidence matters.

## Screenshots

> **TODO** — screenshots have not been captured yet. See
> [`docs/screenshots/README.md`](docs/screenshots/README.md) for the
> capture list (landing, dashboard, issue triage, PR summary, changelog,
> docs generator, trust center, readiness, audit log).

## Tech stack

- TanStack Start (React 19, SSR, server functions) on Vite 7
- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase Auth and Postgres (with row-level security)
- GitHub REST API
- Server-side AI gateway (AI provider keys never reach the browser)
- Cloudflare Workers / edge-compatible deployment

## Quickstart

```bash
bun install
cp .env.example .env   # fill in the values described below
bun run dev
```

Quality checks:

```bash
bun run lint        # ESLint
bun run typecheck   # TypeScript (no emit)
bun run build       # production build
```

## Environment variables

See [`.env.example`](./.env.example) for the full list and placeholder
values. For the client bundle, set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`)

For server-side code, `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` /
`SUPABASE_ANON_KEY` are accepted as fallbacks, plus the server-only
`SUPABASE_SERVICE_ROLE_KEY`. GitHub OAuth and the AI gateway key are
optional and gate their respective features.

### Troubleshooting

**`Missing Supabase environment variable(s): SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY`**

The deployment is missing the Supabase URL and publishable/anon key.
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the safe public
values, never the service role key) in your deployment environment and
redeploy. Demo mode at `/demo` continues to work even without these vars.

## GitHub OAuth setup

1. Create a GitHub OAuth App at <https://github.com/settings/developers>.
2. Set the **Authorization callback URL** to:
   ```
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```
3. In your Supabase project: **Authentication → Providers → GitHub**, paste
   the Client ID and Client Secret, and enable the provider.
4. Recommended scopes: `read:user user:email repo read:org`.
   - `repo` is required to comment on issues, comment on PRs, apply labels,
     and create draft releases on private repositories.
   - `public_repo` is sufficient for the same actions on public repositories.

On first sign-in the GitHub access token is persisted in the service-role
protected `user_github_tokens` table. Tokens are never returned to the
browser and never logged.

## Supabase setup

The schema is managed via SQL migrations in
[`supabase/migrations/`](./supabase/migrations) and applied through the
Supabase CLI or your hosting provider's migration runner.

Every table holding repository data is gated by row-level security through
the `has_repo_access(user_id, repository_id)` security-definer function. A
user only sees rows for repositories they have a row for in
`repository_memberships`.

For schema details and a per-table RLS overview see
[`docs/DATABASE.md`](./docs/DATABASE.md) and
[`docs/SUPABASE_RLS.md`](./docs/SUPABASE_RLS.md).

## AI gateway setup

All AI calls run **server-side only**. The browser never sees the AI key.
Prompts include only the relevant issue / PR / repository context, every
response is validated with a Zod schema, and every call is written to the
audit log with model, action, and outcome.

The current implementation expects `LOVABLE_API_KEY` for the managed AI
gateway. Set it in your hosting environment's server secrets. If it is
missing, AI generation buttons are disabled in the UI and a configuration
warning is shown instead of placeholder output.

See [`docs/AI_SAFETY.md`](./docs/AI_SAFETY.md) for the safety policy that
governs every AI prompt.

## Documentation

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/SECURITY_MODEL.md](./docs/SECURITY_MODEL.md)
- [docs/AI_SAFETY.md](./docs/AI_SAFETY.md)
- [docs/DATABASE.md](./docs/DATABASE.md)
- [docs/SUPABASE_RLS.md](./docs/SUPABASE_RLS.md)
- [docs/DEMO_MODE.md](./docs/DEMO_MODE.md)
- [docs/ROADMAP.md](./docs/ROADMAP.md)
- [docs/LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md)
- [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- [docs/RELEASE_CHECKLIST.md](./docs/RELEASE_CHECKLIST.md)
- [docs/MAINTAINER_HANDOFF.md](./docs/MAINTAINER_HANDOFF.md)
- [docs/RELEASE_NOTES_v0.1.0.md](./docs/RELEASE_NOTES_v0.1.0.md)
- [docs/screenshots/README.md](./docs/screenshots/README.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [SECURITY.md](./SECURITY.md)

## Limitations

- Pre-1.0. Interfaces, schemas, and behaviour may change without notice.
- No automated test suite yet. Quality is currently enforced by lint,
  typecheck, build, and a manual smoke-test checklist.
- Screenshots are not yet captured.
- Test GitHub write actions on a test repository before pointing
  MaintainerOS at a real project.
- AI outputs require human review. They are drafts, not decisions.
- Repository file contents (SECURITY.md, CODEOWNERS, dependency manifests)
  are not yet read by the security readiness signals.

## Contributing

Issues and pull requests are welcome. Please read
[CONTRIBUTING.md](./CONTRIBUTING.md) and the
[Code of Conduct](./CODE_OF_CONDUCT.md) before opening a PR, and follow the
issue and pull request templates in [`.github/`](./.github).

## Security

For responsible disclosure see [SECURITY.md](./SECURITY.md). Please do not
file security reports as public GitHub issues.

## License

[MIT](./LICENSE)
