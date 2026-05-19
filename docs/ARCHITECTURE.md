# Architecture

MaintainerOS is a TanStack Start (React 19 + Vite) application backed by Lovable Cloud (managed Supabase) and the Lovable AI Gateway.

## High-level

```
Browser ──► TanStack Start app ──► createServerFn handlers ──► Supabase (Postgres + Auth + RLS)
                                              │
                                              └──► GitHub REST API (read + opt-in write)
                                              └──► Lovable AI Gateway (server-only)
```

## Runtimes

- **Client**: React 19, TanStack Router, React Query, Tailwind.
- **Server**: TanStack Start server functions (`createServerFn`) and server routes under `src/routes/api/`. Runs on Cloudflare-style Workers via Vite.
- **Database**: Supabase Postgres with row-level security on every user-data table.
- **Auth**: Supabase Auth using GitHub OAuth.

## Key modules

| Path                                        | Purpose                                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/lib/github.functions.ts`               | Public-facing read sync server fns (repos, issues, PRs, contributors).        |
| `src/lib/github/*.server.ts`                | Server-only GitHub REST client and write helpers.                             |
| `src/lib/ai/provider.server.ts`             | Server-only Lovable AI Gateway wrapper with retry + timeout + Zod validation. |
| `src/lib/ai/prompts/*`                      | Per-feature prompt templates (issue triage, PR summary, changelog, docs).     |
| `src/lib/ai.functions.ts`                   | Server fns for AI issue triage.                                               |
| `src/lib/ai-pr.functions.ts`                | Server fns for AI PR summaries and changelog drafts.                          |
| `src/lib/docs.functions.ts`                 | Server fns for documentation generation and readiness signals.                |
| `src/lib/github-publish.functions.ts`       | Server fns for confirmed GitHub write actions.                                |
| `src/components/publish-confirm-dialog.tsx` | Reusable confirmation dialog for any GitHub write.                            |
| `src/routes/app.*.tsx`                      | Authenticated app routes (dashboard, triage, pulls, changelog, docs, …).      |

## Data flow

1. User signs in with GitHub via Supabase Auth.
2. Server functions call GitHub with the user's OAuth token (read-only by default).
3. Synced data is upserted into Supabase per-repository tables.
4. AI features read from Supabase, call Lovable AI Gateway server-side, validate the response, and store an editable draft.
5. Publishing a draft to GitHub requires an approved draft, a click, a confirmation dialog, a duplicate-protection check, and writes an audit log entry.

See [SECURITY_MODEL.md](./SECURITY_MODEL.md) and [AI_SAFETY.md](./AI_SAFETY.md).
