# Production Readiness

This document defines what "production-ready" means for MaintainerOS and
records which gates have been verified. It is the source of truth for the
project's production status. The companion file
[`PRODUCTION_CHECKLIST.md`](./PRODUCTION_CHECKLIST.md) is the operational
checklist used to track progress.

> **Current status: Public preview.** MaintainerOS is pre-1.0 and is **not**
> recommended for production use on sensitive repositories. Several P0
> gates below remain unverified.

## What "production-ready" means here

For MaintainerOS, production-ready is not "the build passes". It means all
of the following are true, simultaneously, and have been verified:

1. **Access control is verified.** Cross-user and cross-repository
   isolation is enforced by Postgres row-level security and proven by
   integration tests against a real database.
2. **GitHub permissions are least-privilege.** Repository access is
   scoped, ideally via a GitHub App with selected-repository
   installation, and read-only by default.
3. **Secrets and tokens are protected.** No service-role key, AI key,
   GitHub token, or session token reaches the browser, the audit log,
   the AI prompt input, or the build artifacts.
4. **AI cannot act autonomously.** Every AI output is an editable draft.
   No AI path writes to GitHub, applies labels, or publishes releases on
   its own.
5. **GitHub writes are approval-gated and auditable.** Every write
   requires an approved draft, an explicit user click, a confirmation
   dialog with payload preview, a duplicate-protection check, and an
   audit-log row.
6. **Releases stay draft.** Releases are always created with
   `draft: true` server-side. There is no non-draft publish path.
7. **Core flows are tested.** Unit, integration (mocked GitHub + real
   Postgres for RLS), and end-to-end smoke tests cover the demo, setup,
   login failure, approval queue, report export, and publish-preview
   flows.
8. **Runtime is observable.** Health checks, structured logs, and error
   reporting allow diagnosis without exposing secrets.
9. **Failure modes are graceful and reversible.** Rate limits, expired
   tokens, AI outages, and GitHub API failures degrade safely. Rollback
   guidance exists for every write surface.
10. **Operational ownership is documented.** Runbook, incident response,
    backup/restore, secret rotation, and revocation flows are written
    down and have been walked through at least once.
11. **No unverified claims are made.** No "production-ready",
    "vulnerability-free", "SOC 2", "penetration tested", or
    "autonomous" language appears in the repo or product UI.

## Release gates

Each gate is binary. Production status is the AND of all P0 gates.

### P0 — Security gates

- [ ] No service-role key in any client bundle (verified by grep + build inspection)
- [ ] No GitHub token in any client bundle or log
- [ ] RLS enabled on every user-data table (verified by `supabase--linter`)
- [ ] RLS cross-user and cross-repo isolation proven by integration tests
- [ ] Token table (`user_github_tokens`) inaccessible to `anon` and `authenticated`
- [ ] Secret scanning, push protection, CodeQL, Dependabot enabled in GitHub
- [ ] Private vulnerability reporting enabled in GitHub
- [ ] Prompt-injection defenses documented and unit-tested

### P0 — Test gates

- [ ] CI green on `main`: typecheck, lint, unit, build
- [ ] Integration tests for GitHub write paths (mocked fetch)
- [ ] Integration tests for RLS (real Postgres in CI)
- [ ] E2E smoke tests for demo, setup, login, approval queue, report export
- [ ] Failing critical test blocks release (documented and enforced)

### P0 — OAuth / GitHub gates

- [ ] Production OAuth callback URL configured and verified end-to-end
- [ ] Read-only repository mode exists and is the default for new connections
- [ ] Write-capable mode requires explicit per-repo opt-in
- [ ] Token revocation / disconnect flow tested
- [ ] Expired / revoked credentials fail safely with a reconnect path

### P0 — RLS / database gates

- [ ] Every public-schema table has documented RLS posture
- [ ] Every public-schema table has explicit GRANTs matching its policies
- [ ] Service-role usage is restricted to server-only files (verified by import-graph rules)
- [ ] Migration rollback procedure documented
- [ ] Backup / restore documented

### P0 — Monitoring gates

- [ ] Health endpoint exposes booleans only (no secret values)
- [ ] Error tracking integration documented (off by default, opt-in)
- [ ] Rate-limit handling documented for AI and GitHub paths
- [ ] Per-user generation limits implemented or documented as deferred

### P0 — Incident response gates

- [ ] Runbook: deploy, rollback, rotate secrets, revoke tokens, disable AI, disable publishing
- [ ] Walkthrough of at least one simulated incident recorded
- [ ] Contact / disclosure channel documented in `SECURITY.md`

### P0 — Documentation gates

- [ ] `PRODUCTION_READINESS.md` (this file)
- [ ] `PRODUCTION_CHECKLIST.md`
- [ ] `OPERATIONS_RUNBOOK.md`
- [ ] `PRIVACY_AND_DATA_HANDLING.md`
- [ ] `GITHUB_WRITE_SAFETY.md`
- [ ] `PROMPT_INJECTION_DEFENSES.md`
- [ ] `RLS_TESTING.md`
- [ ] `SUPPLY_CHAIN_SECURITY.md`
- [ ] `OAUTH_AND_PERMISSIONS.md`
- [ ] `GITHUB_APP_MODEL.md`
- [ ] `PRODUCTION_RELEASE_DECISION.md`

## Status today

| Area              | Status                        |
| ----------------- | ----------------------------- |
| Public preview    | Achieved                      |
| Production target | Not yet — P0 gates incomplete |
| Sensitive-repo    | Blocked until P0 gates pass   |

Specific known gaps (non-exhaustive):

- No live OAuth E2E test
- No RLS integration tests against a real database
- No GitHub write integration tests against a real or sandbox repo
- No hosted demo verification beyond manual checks
- No production monitoring or alerting wired up
- No external security review
- No formal incident-response drill
- Private vulnerability reporting not yet confirmed enabled
- Screenshots not yet captured
- `/setup` helper not yet fully wired to the new checklist primitives
- GitHub OAuth scope model is broader than ideal for sensitive repositories

## Sensitive-repository policy

When the GitHub App / least-privilege model lands (Phase P1) and
sensitive-repository mode lands (Phase P9), the defaults for any repo
connection will be:

- Read-only by default
- Selected-repository GitHub App installation (not org-wide)
- Metadata-only AI processing by default (titles, labels, states,
  timestamps — no body text) with explicit opt-in to send full content
- Publishing disabled by default
- Per-repo settings to re-enable each capability
- Global "panic switches" to disable AI, publishing, and sync

Until that work lands, MaintainerOS should not be connected to
sensitive repositories.

## Language we will not use

Until externally reviewed and signed off, MaintainerOS will not describe
itself as any of:

- "Production-ready"
- "Guaranteed secure"
- "Vulnerability-free"
- "SOC 2 compliant" / "ISO 27001 compliant"
- "Penetration tested"
- "Safe for all sensitive repositories"
- "Autonomous publishing"

Progress labels we **will** use:

- "Public preview" (today)
- "Production candidate — controlled pilot only" (after P0 gates pass,
  before external review)
- "Production-ready for controlled use" (after external review,
  staging verification, and owner sign-off — see
  [`PRODUCTION_RELEASE_DECISION.md`](./PRODUCTION_RELEASE_DECISION.md))

## How this document is updated

- Each phase (P0–P10) updates the relevant gate(s) when complete.
- A gate is only marked complete when a linked artifact (test, doc, or
  audit log) exists in the repo.
- Marketing copy, README badges, and product UI labels must match this
  document. If they drift, this document wins.
