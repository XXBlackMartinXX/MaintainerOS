# Maintainer handoff

This document is for the next person taking over MaintainerOS. It captures
what the app does, how it's wired together, and the operational tasks you'll
actually hit.

## What MaintainerOS does

A focused, AI-assisted dashboard for open-source maintainers. It syncs
GitHub data, generates editable AI drafts for triage / PR summaries /
changelogs / docs, and lets the maintainer publish approved drafts back to
GitHub after explicit confirmation.

## Architecture overview

- **Frontend:** TanStack Start v1 (React 19 + Vite 7), Tailwind v4,
  shadcn/ui, semantic design tokens in `src/styles.css`.
- **Backend:** Lovable Cloud (Supabase) — Postgres, Auth (GitHub OAuth),
  RLS, Storage if needed.
- **Server logic:** TanStack `createServerFn` functions in
  `src/lib/*.functions.ts`. No Supabase Edge Functions.
- **AI:** Lovable AI Gateway via `src/lib/ai/provider.server.ts`.
  Prompts under `src/lib/ai/prompts/`. All outputs validated with Zod.
- **Routing:** File-based routes in `src/routes/`. App routes under
  `/app/*`, public landing at `/`.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`DATABASE.md`](./DATABASE.md),
and [`SUPABASE_RLS.md`](./SUPABASE_RLS.md) for more.

## Required services

- **Lovable Cloud** (Supabase project — auto-provisioned)
- **GitHub OAuth App** registered against the Supabase Auth callback
- **Lovable AI Gateway** key (`LOVABLE_API_KEY` in Supabase Edge env)

## Environment variables

Public (auto-injected by Lovable Cloud, never edit `.env` manually):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Server-only (set in Supabase project secrets):

- `SUPABASE_SERVICE_ROLE_KEY`
- `LOVABLE_API_KEY`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` (Supabase Auth provider)

See `.env.example` for the canonical list.

## Release process

1. Update `CHANGELOG.md` with a new version section.
2. Bump `version` in `src/lib/project-meta.ts` and `package.json`.
3. Update `docs/RELEASE_NOTES_v<version>.md` (copy the v0.1.0 file as a
   template).
4. Run through `docs/RELEASE_CHECKLIST.md`.
5. Create a GitHub **draft** release with the new release notes; publish
   only after smoke-testing the deployed preview.

## Safety principles (do not weaken)

- AI calls are server-side only.
- All GitHub writes require: approved/edited draft + click + confirmation
  + duplicate check + audit log entry.
- Releases are always created as `draft: true`.
- No automatic commenting, labeling, merging, closing, or release
  publishing — anywhere.
- Demo mode never calls GitHub write functions.
- Never display invented metrics, stars, contributors, or "users".

## Common operational tasks

- **Add a new AI prompt:** add a file under `src/lib/ai/prompts/`, define a
  Zod schema in `src/lib/ai/schemas.ts`, and call it from a server function.
- **Add a new GitHub write action:** extend `src/lib/github/write.server.ts`,
  add a publish server function, wire the UI through
  `PublishConfirmDialog`, and record an entry in `github_publish_events`.
- **Apply a database migration:** create a new file in
  `supabase/migrations/` and use the Supabase migration tool. Never edit
  `src/integrations/supabase/types.ts` by hand.
- **Rotate the Lovable AI Gateway key:** use the `ai_gateway` tool family
  in Lovable, then redeploy.

## Known limitations

- Documentation drafts are copied manually (no auto-PR yet).
- Sync is on-demand; no webhooks or background polling.
- Security readiness is heuristic.
- One GitHub account per Lovable account.

## Where to change project URLs

All public URLs live in **`src/lib/project-meta.ts`**. The repo URL is already
configured; the `TODO_PUBLIC_DEMO_URL` placeholder still needs to be replaced once a live demo is deployed. Footer
links, settings, Trust Center, and launch copy all read from this file.

## Pre-publication checklist

See [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) for the full list.
