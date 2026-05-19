# MaintainerOS

> An AI operations center for open-source maintainers.

MaintainerOS helps open-source maintainers manage GitHub repositories with AI-powered
issue triage, PR summaries, changelogs, contributor insights, and repo health analytics
— all in one focused dashboard. Every AI output is a **draft**; nothing is posted to
GitHub without explicit maintainer approval.

> **Status:** v0.1 — polished UI shell with clearly-labeled demo data. Live GitHub
> sync and AI features are scoped for upcoming releases.

## Features

- **AI Issue Triage** — type, severity, priority, suggested labels, draft replies
- **PR Summarizer** — plain-English summaries, risk signals, suggested changelog entries
- **Changelog Generator** — Keep-a-Changelog format, suggested semver bump, Markdown export
- **Repo Health Score** — 0–100 across issues, PRs, docs, security, community
- **Contributor Insights** — top, returning, first-time contributors (privacy-respecting)
- **Security Center** — cautious surfacing of potential risks
- **Community Moderation** — spam / low-quality / duplicate suggestions, never automatic
- **Documentation Generator** — drafts for README, CONTRIBUTING, SECURITY, templates
- **Roadmap Planner** — AI-clustered themes you can promote to milestones
- **AI Action Log** — full audit trail of every AI draft, edit, approval, and rejection

## Ethics

MaintainerOS is built to be honest and useful:

- Never fakes stars, contributors, downloads, commits, or activity
- Never auto-posts, auto-closes, or auto-enforces — every action requires approval
- Never infers sensitive personal traits about contributors
- Uses cautious language ("potential risk", "review recommended") when confidence is low
- Logs every AI action with model, target, and outcome

## Tech stack

This implementation runs on:

- **TanStack Start** (React 19, SSR, server functions)
- **TypeScript** + **Tailwind CSS v4** + **shadcn/ui**
- **Recharts** for analytics
- **Lovable Cloud** (Supabase) for auth, Postgres, storage
- **Lovable AI Gateway** for AI features (BYO OpenAI-compatible key also supported)
- Cloudflare Workers deployment (Vercel-compatible alternative available)

> The original spec called for Next.js 14 + Prisma. This template uses TanStack
> Start instead; the capabilities, server functions, and database surface are
> equivalent. See `docs/architecture.md` for the mapping.

## Local development

```bash
bun install
bun run dev
```

## Environment variables

See `.env.example`. Required for live (non-demo) use:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_WEBHOOK_SECRET=
LOVABLE_API_KEY=          # provisioned automatically in Lovable Cloud
```

## Roadmap

- [x] Polished UI shell with all 14 surfaces
- [ ] GitHub OAuth + repo sync
- [ ] Live AI issue triage via Lovable AI Gateway
- [ ] Webhook receiver under `/api/public/github`
- [ ] Self-host guide

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). All contributors are expected to follow
the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Security

See [SECURITY.md](./SECURITY.md) for our responsible disclosure policy.

## License

[MIT](./LICENSE)
