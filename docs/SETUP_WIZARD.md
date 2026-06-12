# Setup Wizard

`/setup` is a guided checklist that classifies each prerequisite as
`configured`, `missing`, or `manual_verification_required`.

## Items checked

| Item | Handled by | Required now |
|---|---|---|
| Client Supabase env vars | lovable | ✓ |
| Server Supabase env vars | lovable | ✓ |
| AI gateway (`LOVABLE_API_KEY`) | lovable | ✓ |
| GitHub provider in Supabase Auth | owner | ✓ |
| Redirect URL allow-list | owner | ✓ |
| GitHub OAuth scopes | owner | ✓ |
| Deployment URL known | owner | ✓ |
| Demo-mode verification | owner | ✓ |
| GitHub App scaffold (future) | owner | optional |

## Rules

- The wizard renders **booleans only** — never secret values.
- Owner-handled items link out to the relevant docs and never claim that
  MaintainerOS has performed the setup on your behalf.
- "Manual verification required" is shown when the platform cannot
  introspect the setting (e.g. whether redirect URLs are correctly listed in
  the Supabase auth allow-list).
- Future GitHub App readiness (`githubAppId`, `githubAppPrivateKey`, etc.) is
  surfaced in the wizard but not consumed by the runtime yet. See
  `docs/GITHUB_APP_MIGRATION_PLAN.md`.

## Source

Logic lives in `src/lib/setup/checklist.ts` and is exercised by
`src/lib/setup/checklist.test.ts`. Server-side boolean status is provided by
`getServerConfigStatus` in `src/lib/setup.functions.ts`, which **never**
returns secret values, only `Boolean(env.X)` flags.
