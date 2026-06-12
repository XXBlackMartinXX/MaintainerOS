# Flow Testing

This document inventories MaintainerOS's core user flows and records what is
covered by automated tests, what must be tested manually, and what stays
unverified until a future phase. It is the source of truth for "what works
without live credentials" and for the manual smoke checklist used before
each release.

> Scope: P3 — Core Feature Reliability. This phase did not add live GitHub,
> Supabase, or AI integration tests. Browser E2E (Playwright) is deferred —
> see the "Why no Playwright yet" section at the bottom.

## Flow coverage matrix

Legend: ✅ automated · 📝 manual checklist · ⏳ deferred / requires live creds

| Flow                                             | Coverage | Notes                                                                                          |
| ------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------- |
| Landing page renders                             | 📝       | Static route, no data dependency.                                                              |
| Landing CTA → `/demo` → `/app`                   | 📝       | `enableDemoMode()` unit-tested. Redirect chain is manual.                                      |
| Demo dashboard sample data                       | ✅       | `demo-banner` copy + `use-demo-mode` covered by unit tests; sample data is deterministic.      |
| `/login` with missing Supabase config            | ✅       | `safe-client` test + login copy-invariants test prove no crash and clear guidance.             |
| `/login` happy path (GitHub OAuth)               | ⏳       | Requires Supabase + GitHub provider. See `docs/PRODUCTION_AUTH_SETUP.md`.                      |
| `/auth/callback` failure surface                 | 📝       | Error hash params are parsed and rendered on `/login`. Manual: visit with `?error=...`.        |
| `/setup` diagnostics, no secret leakage          | ✅       | `getServerConfigStatus` returns booleans only; no env values are ever returned to the client.  |
| Onboarding / repo selection                      | ⏳       | Requires authenticated session + GitHub token.                                                 |
| Issue triage draft                               | ✅ + ⏳  | AI Zod schemas tested. Live AI call is manual.                                                 |
| PR summary draft                                 | ✅ + ⏳  | Same as above.                                                                                 |
| Changelog / release draft                        | ✅ + ⏳  | Schemas tested. Drafts stay drafts — never auto-published.                                     |
| Docs draft                                       | ✅ + ⏳  | Schemas tested.                                                                                |
| Approval-gated publish confirmation dialog       | ✅       | Copy invariants pinned per kind (issue_comment, issue_labels, pr_comment, release_draft).      |
| Approval queue server-side ownership check       | ✅       | `approval-queue/queue.test.ts` + RLS static checks.                                            |
| GitHub write paths                               | ✅ + ⏳  | `github/write.server.test.ts` covers client logic. Live writes are manual against a sandbox.   |
| Audit log / actions page                         | 📝       | Reads `github_publish_events` (service-role only). Requires real data.                         |
| Global error recovery (route errors)             | 📝       | Manual: trigger a synthetic loader error and confirm retry button calls `router.invalidate()`. |
| RLS allow/deny at runtime                        | ⏳       | Static policy checks enforced in CI; runtime allow/deny remains in `docs/RLS_TEST_PLAN.md`.    |

## Automated reliability tests (added in P3)

- `src/integrations/supabase/safe-client.test.ts` — proves that:
  - `isSupabaseConfigured()` is `false` when env is missing and `true` when set.
  - `getSupabase()` returns `null` instead of throwing when unconfigured
    (this is what keeps `/login`, `/demo`, and the marketing routes alive
    on a fresh deploy without Supabase env vars).
  - The module's public surface never exposes a service-role or secret
    value.
- `src/lib/reliability/copy-invariants.test.ts` — pins the user-facing copy
  for the three reliability-critical surfaces so a future refactor cannot
  silently remove the guard rails:
  - `/login` shows "Backend setup required" + a link to `/setup` and `/demo`
    whenever Supabase env vars are missing.
  - The demo banner explicitly labels data as sample and says publishing
    and GitHub sync are disabled.
  - The publish confirmation dialog has destructive-action warning copy
    for every supported kind and supports a "Post again" flow.

These are intentionally static-text checks, not React renders. They are
fast, deterministic, and do not require a DOM or `@testing-library/react`,
which keeps the CI suite small and stable.

## Manual smoke checklist

Run this before publishing a release or after non-trivial UX changes. No
live credentials are required for items 1–5.

1. **Landing page** (`/`)
   - Renders without console errors.
   - "Try the demo" CTA navigates to `/app` with the demo banner visible.

2. **Demo mode** (`/demo` → `/app`)
   - Banner says "Demo mode active" and explains publishing/sync are disabled.
   - Every page in the sidebar loads with sample data and an AI-output
     label that reads "Demo AI output" (not "AI draft").
   - "Exit demo" returns to a non-demo state and (without auth) bounces to
     `/login`.

3. **Unconfigured backend** (clear `localStorage` + visit `/login`)
   - Page renders with "Backend setup required" callout.
   - "Continue with GitHub" button is disabled.
   - Links to `/setup` and `/demo` are present and clickable.

4. **Setup diagnostics** (`/setup`)
   - Page loads and prints booleans only — no secret values, JWTs, or URLs
     beyond the public Supabase host.

5. **Error recovery**
   - Force a synthetic error in any `/app/*` route and confirm the error
     UI exposes a retry button. After clicking, the route re-runs its
     loader (router.invalidate + reset).

6. **OAuth happy path** (requires a configured backend)
   - "Continue with GitHub" completes and lands on `/app`.
   - `/auth/callback` does not surface OAuth provider errors.
   - Cancelling the GitHub consent screen returns to `/login` with a
     human-readable error message.

7. **Approval-gated publish** (requires a connected sandbox repo)
   - Drafting a comment / labels / PR summary / release leaves it in the
     approval queue.
   - The confirmation dialog shows the destructive-action warning AND a
     preview of the exact payload.
   - Cancelling closes the dialog and posts nothing.
   - Confirming once posts. Confirming again surfaces "Already posted" and
     offers "Post again".

## Why no Playwright yet

Playwright would add ~120 MB of browser binaries to CI, a separate runner
config, and a new class of flaky failures (download timeouts, browser
launch, viewport quirks). For the current scope — demo mode and
missing-config flows — the static copy-invariants tests give the same
regression protection at a fraction of the cost.

E2E coverage is recommended for the production release (post-1.0) where
real OAuth, real GitHub writes against a sandbox repo, and a real
authenticated approval flow all need to be exercised end-to-end. That
work is tracked in `docs/PRODUCTION_CHECKLIST.md`.

## Production readiness impact

P3 narrows the gap between "documented" and "verified" for the flows that
do not require live credentials. It does **not** change the production
readiness verdict: live OAuth, runtime RLS allow/deny, and end-to-end
publish-to-GitHub still need to be exercised manually (or, post-1.0,
under Playwright + a sandbox repo) before a production claim is made.
