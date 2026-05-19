# MaintainerOS

> An honest, AI-assisted operations center for open-source maintainers.

MaintainerOS connects to your GitHub repositories and gives you one focused
dashboard for issues, pull requests, contributors, repo health, and AI drafts
for triage, summaries, and changelogs. Every AI output is a **draft** — nothing
is posted to GitHub without your explicit approval.

> **Status:** v0.3 — live GitHub OAuth, repository sync, and live data on
> the Issues, Pull Requests, Contributors, and Repo Health pages. Real AI
> triage is the next slice.

## Implemented today

- GitHub OAuth via Lovable Cloud (Supabase Auth)
- Repository connection + on-demand sync (issues, PRs, contributors, labels, commits)
- Live Issues page (search, filters, sort, stale detection)
- Live Pull Requests page (search, state/merged filters, sort, large-diff warnings)
- Live Contributors page (distribution chart, top contributors, privacy-respecting wording)
- Live Repo Health score with transparent breakdown and recommended actions
- Dashboard sync-status panel with last-sync time, counts, error surfacing, and a Sync now button
- Clear `Live GitHub data`, `Partial data`, and `Demo data` badges everywhere
- Polished shell for changelog, docs, security, moderation, roadmap, and AI action log (preview)

## Ethics

MaintainerOS is built to be honest:

- Never fakes stars, contributors, downloads, commits, or activity
- Never auto-posts, auto-closes, or auto-enforces — every action requires approval
- Never infers sensitive personal traits about contributors
- Uses cautious language ("review recommended", "partial signal") when confidence is low
- Logs every AI action with model, target, and outcome

## Tech stack

- **TanStack Start** (React 19, SSR, server functions) on Vite 7
- **TypeScript** + **Tailwind CSS v4** + **shadcn/ui**
- **Lovable Cloud** (Supabase) for auth, Postgres, RLS
- **Lovable AI Gateway** for AI features (planned)
- Cloudflare Workers / Vercel-compatible deployment

## Local development

```bash
bun install
bun run dev
```

## GitHub OAuth setup

1. Create a GitHub OAuth App at <https://github.com/settings/developers>.
2. Set the **Authorization callback URL** to:
   ```
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```
3. In Lovable Cloud → **Auth → Providers → GitHub**, paste your Client ID and
   Client Secret and enable the provider.
4. Recommended scopes: `read:user user:email repo read:org`.

On first sign-in, MaintainerOS persists the GitHub access token in the
service-role-protected `user_github_tokens` table. Tokens are never returned
to the browser and never logged.

## Database & RLS

The schema is managed via Supabase migrations in `supabase/migrations/`.
Every table that holds repository data is gated by RLS through the
`has_repo_access(user_id, repository_id)` security-definer function. A user
sees repository rows only if they have a row in `repository_memberships`.

## Sync model

- The user picks repositories during `/onboarding`.
- The active repository is stored client-side (localStorage) and selectable
  from the top nav.
- The Dashboard surfaces sync state (`idle` · `running` · `success` · `error`)
  and counts. A **Sync now** button calls the `syncRepository` server function,
  which pulls issues, PRs, contributors, labels, and commits in parallel
  (paginated, capped to keep API usage modest) and upserts into Postgres.
- All page-level queries are scoped by RLS to the authenticated user.

## Live vs demo data

- Pages backed by synced data display a green `Live GitHub data` badge.
- Pages that still rely on illustrative numbers display a yellow `Demo data`
  badge so nothing is presented as a real metric.
- The Repo Health page shows `Partial data` for signals (security, releases)
  that are not yet wired to real sources.

## Environment variables

See `.env.example`. In Lovable Cloud most server-side values are managed for
you; only the GitHub OAuth credentials need to be configured in the Auth
provider screen.

## Deployment

The project is preconfigured for Cloudflare Workers (`wrangler.jsonc`). Any
Edge-compatible host that supports TanStack Start works — set the same
environment variables and run the project's build script.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). All contributors are expected to
follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Security

See [SECURITY.md](./SECURITY.md) for responsible disclosure.

## License

[MIT](./LICENSE)
