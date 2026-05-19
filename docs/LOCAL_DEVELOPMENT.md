# Local Development

## Prerequisites

- Bun (or Node 20+)
- A Lovable Cloud project (preconfigured `.env` provided by Lovable)
- GitHub OAuth app credentials configured in Supabase Auth → Providers → GitHub

## Install

```bash
bun install
```

## Run dev server

The Lovable workspace runs the dev server for you. If running standalone:

```bash
bun run dev
```

## Quality checks

| Command | Purpose |
| --- | --- |
| `bun run lint` | ESLint |
| `bun run typecheck` | TypeScript (no emit) |
| `bun run build` | Production build |

## Smoke-test checklist

Run through these manually before publishing a release:

1. Sign in with GitHub.
2. Select a repository, run a sync, confirm issues / PRs appear.
3. Generate an AI triage for one issue. Approve it. Publish reply to a test repo.
4. Generate a PR summary. Approve it. Post comment to a test PR.
5. Generate a changelog draft. Approve it. Create a draft release.
6. Generate a README documentation draft. Copy it.
7. Visit `/app/actions` — confirm every action above is logged.
8. Toggle demo mode — confirm banner appears and publish buttons are disabled.

## Troubleshooting

- "Unauthorized" on every server function → check that `attachSupabaseAuth` is registered in `src/start.ts`.
- "AI Gateway not configured" → set `LOVABLE_API_KEY` in Lovable Cloud secrets.
- GitHub publish fails with 403 → reconnect GitHub with the `repo` scope.
