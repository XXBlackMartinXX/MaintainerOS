# MaintainerOS Upgrade Roadmap — Execution Plan

This is a very large request (7 phases, ~40+ discrete tasks). Doing it all in one turn would produce a single sprawling commit that's hard to review and easy to break. I'd like to confirm scope and sequencing before I start writing code.

## Proposed execution order

I'll deliver one phase per turn, each as a small reviewable pass with a precise report at the end. You can stop, redirect, or skip any phase between turns.

### Turn 1 — Phase 0: Baseline verification (audit only, no edits)

- Verify `.env` untracked, `.env.example` present, `.gitignore` covers env files
- Verify `.github/workflows/ci.yml`, `docs/TESTING.md`, `SECURITY.md` (no placeholder)
- Forbidden-wording scan
- Confirm `package.json` scripts: `typecheck`, `lint`, `build`
- Report: safe to continue Y/N. No file changes.

### Turn 2 — Phase 1: Core flow smoke audit

- Static audit of 13 listed flows: route, files, demo behavior, live behavior, env vars, failure modes
- Fix only crashes / blank-screen / misleading copy found during audit
- No new features

### Turn 3 — Phase 2: Testing + CI upgrade

- Add Vitest (no Playwright yet — Playwright in CI without a stable preview is flaky and out of scope for a first pass)
- Unit tests for: `src/lib/env.ts`, `src/hooks/use-demo-mode.ts`, `src/lib/ai/schemas.ts`, `src/components/publish-helpers.tsx`
- Extend `.github/workflows/ci.yml` to run `bun test`
- Report exact commands + results

### Turn 4 — Phase 3: Security & trust docs

- Add `docs/THREAT_MODEL.md`, `docs/SECURITY_REVIEW_CHECKLIST.md`
- Update `docs/SECURITY_MODEL.md` if gaps found
- Review (read-only) RLS policy coverage via `supabase--linter`; document findings
- Advisory wording only; no certification claims

### Turn 5 — Phase 4: Product professionalism polish

- Empty/loading/error state pass on app routes
- Consistent demo/live badges, "AI draft" / "approval required" labels
- No new features, no fake data

### Turn 6 — Phase 5: High-value maintainer features

- Repo Health Center: expand existing readiness checks with evidence + confidence
- Approval Queue: consolidate existing draft surfaces into one review route
- Exportable Markdown maintainer report
- Setup Wizard improvements on `/setup`

### Turn 7 — Phase 6: Claude for OSS application docs

- `docs/CLAUDE_FOR_OSS_APPLICATION.md`
- `docs/PROJECT_IMPACT.md`
- Update `docs/ROADMAP.md`, `docs/MAINTAINER_HANDOFF.md`
- Honest about pre-1.0 status, no fabricated metrics

### Turn 8 — Phase 7: Final release readiness scan

- Re-run all checks
- Final report; no release published, no visibility changed

## Constraints I'll honor on every turn

- No secrets in code, no `.env` commits, `.env.example` preserved
- No fabricated users/stars/metrics/testimonials/screenshots
- No "production ready" claim unless tests + CI + deploy + OAuth + flows are all verified (they aren't yet)
- Demo mode, real-auth path, AI-draft labeling, approval-gated publishing, draft-only releases — all preserved
- Small, reviewable passes

## Questions before I start

1. **Confirm one-phase-per-turn cadence?** Or do you want me to chain Phase 0 → Phase 1 → Phase 2 in a single turn and stop there? (Doing all 7 in one turn is not advisable — too much churn, too hard to review, high risk of regressions.)
2. **Playwright e2e in CI: skip for now?** I recommend skipping until there's a stable preview deployment to point it at. Vitest unit tests only in Phase 2.
3. **Approval Queue route name:** new route `/app/approvals`, or extend existing `/app/actions`?
4. **Anything to drop or reprioritize** from the list above?

If you just reply "proceed", I'll default to: one phase per turn, start with Phase 0, skip Playwright, new `/app/approvals` route.
