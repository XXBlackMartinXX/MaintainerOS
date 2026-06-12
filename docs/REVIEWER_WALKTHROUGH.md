# Reviewer Walkthrough

A short, reviewer-facing tour of MaintainerOS. The goal is to let an
external reviewer (Claude-for-OSS, security reviewer, prospective
contributor) evaluate the public preview in 10–15 minutes without
needing to sign up, connect a GitHub account, or hold any secret.

## Positioning (read first)

MaintainerOS is an **open-source, human-approved AI operations dashboard
for GitHub maintainers**. It generates drafts for issue triage, PR
summaries, changelog entries, and documentation, and gates every GitHub
write behind explicit human confirmation. Releases are always created as
drafts. Security and readiness checks are advisory.

The repository is an **initial public preview**. It is not
production-ready and is not recommended for sensitive repositories at
this time. See
[`PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) for the gating
documentation.

## 1. Read the surface docs (5 minutes)

In this order:

1. [`README.md`](../README.md) — what the project is, status, features.
2. [`docs/PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) —
   transparent list of gates that block a production claim.
3. [`docs/AI_SAFETY.md`](./AI_SAFETY.md) — draft-only, approval-gated
   model.
4. [`docs/SECURITY_MODEL.md`](./SECURITY_MODEL.md) and
   [`docs/THREAT_MODEL.md`](./THREAT_MODEL.md) — what is in scope.
5. [`docs/RLS_ACCESS_CONTROL.md`](./RLS_ACCESS_CONTROL.md) — the access
   invariants enforced statically in CI.

## 2. Try the public preview (5–7 minutes)

Follow [`docs/DEMO_SCRIPT.md`](./DEMO_SCRIPT.md). Demo mode runs on
sample data only; no account or secret is needed.

Key surfaces to evaluate:

- **Demo banner** — present on every `/app/*` route.
- **AI draft labeling** — every AI output is badged "AI draft" or
  "Demo AI output".
- **Approval Queue + Publish Confirm dialog** — every GitHub write
  requires an explicit click and confirmation.
- **Trust Center** (`/app/trust`) — "What requires explicit approval"
  and "What is never automatic".
- **Readiness / Security / Health** — advisory framing is visible and
  invariant-checked by CI.
- **`/setup`** — reports booleans only, never prints secret values.

## 3. Inspect the CI signals (2 minutes)

The repository's CI runs five checks on every change:

| Command | Purpose |
|---|---|
| `bun run typecheck` | Strict TypeScript |
| `bun run lint` | ESLint + Prettier |
| `bun run test` | Vitest — pure helpers, schemas, demo, copy invariants |
| `bun run check:rls` | Static RLS policy invariants over `supabase/migrations/` |
| `bun run check:claims` | Forbidden-overclaim wording scan |
| `bun run build` | Production build |

Recent test count: **80/80 passing**. See `.github/workflows/ci.yml`.

## 4. What is intentionally not yet verified

These are listed in [`docs/PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md)
but called out here for reviewers:

- No live OAuth end-to-end test.
- No live GitHub-write integration test.
- No live AI-gateway integration test.
- No runtime RLS allow/deny integration test (static checks only).
- No Playwright E2E.
- No third-party security audit.

## 5. What is *not* claimed

- Production readiness.
- Anthropic approval, partnership, or review.
- SOC 2 / penetration testing / vulnerability-free status.
- Star counts, downloads, user counts, paying users, testimonials.

If you find any claim of the above anywhere in the repo, please open an
issue — that would be a copy regression and CI is supposed to catch it
(`bun run check:claims`).

## 6. Reporting

- Security issues: see [`SECURITY.md`](../SECURITY.md). Private
  vulnerability reporting is the preferred channel once enabled on the
  GitHub repo.
- Other findings: open a GitHub issue using the bug report template.


## P6 — Integration boundaries & sandbox verification

See `docs/INTEGRATION_BOUNDARIES.md` for the per-integration boundary audit and `docs/SANDBOX_VERIFICATION.md` for the owner-run live-service checklist. Run `bun run sandbox:preflight` for a non-destructive local config classifier (never prints secret values).
