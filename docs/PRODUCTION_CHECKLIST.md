# Production Checklist

Operational checklist tracking remaining work to reach production
readiness. The definitions of "done" for each item are in
[`PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md).

Legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[m]` manual
owner task (cannot be automated from inside the app).

## P0 — Governance (this phase)

- [x] `docs/PRODUCTION_READINESS.md`
- [x] `docs/PRODUCTION_CHECKLIST.md`
- [x] README "Production status" section
- [ ] All later docs cross-link back to `PRODUCTION_READINESS.md`

## P1 — GitHub integration hardening (design + scaffold complete)

- [x] `docs/GITHUB_INTEGRATION.md` (current architecture + limitations)
- [x] `docs/GITHUB_APP_MIGRATION_PLAN.md` (future App design)
- [x] Future GitHub App env var detection in `src/lib/env.ts`
- [x] Future GitHub App booleans in `getServerConfigStatus`
- [x] `classifyGithubAppReadiness` helper + tests
- [ ] Token lifecycle: detect expired/revoked, reconnect flow
- [ ] Repo-level permission display in UI
- [m] Create GitHub App in GitHub settings
- [m] Configure App secrets in production environment

## P2 — Supabase RLS verification

- [x] `docs/RLS_ACCESS_CONTROL.md` (invariants + table inventory)
- [x] `docs/RLS_TEST_PLAN.md` (manual runtime checklist + future Option A plan)
- [x] Static policy assertions (`src/lib/security/rls-policy-checks.ts` + vitest suite)
- [x] CI step: `bun run check:rls`
- [ ] [m] CI service container (Postgres) running migrations (Option A, future)
- [ ] [m] Seed harness for User A / User B / Repo A / Repo B (Option A, future)
- [ ] [m] RLS integration tests: cross-user reads/writes blocked (Option A, future)
- [ ] [m] RLS integration tests: token table inaccessible to non-service roles (Option A, future)
- [ ] SQL policy comments on every policy (deferred)
- [ ] Migration rollback documentation (deferred)
- [ ] Backup / restore documentation (deferred)

## Core feature reliability (P3 in recommended ordering)

- [x] `docs/FLOW_TESTING.md` (flow inventory + manual smoke checklist)
- [x] `safe-client` unit tests (unconfigured returns null, no throws, no secret leakage)
- [x] User-facing reliability copy invariants pinned (login missing-config, demo banner, publish dialog)
- [x] CI runs `typecheck`, `lint`, `test`, `check:rls`, `build` — no secrets required
- [ ] Playwright E2E for demo / missing-config / approval dialog (deferred — see `FLOW_TESTING.md`)
- [m] Manual smoke checklist run before each release

## Product professionalism and UX precision (P4 in recommended ordering)

- [x] Central product-copy module (`src/lib/product-copy.ts`) with canonical
      safety labels and reusable empty/setup/advisory strings
- [x] `FORBIDDEN_COPY` lint test fails on overclaiming language anywhere in `src/`
- [x] Advisory wording invariants on `/app/security`, `/app/readiness`,
      `/app/health`, and `/app/trust`
- [x] `EmptyRepositoryState` offers a demo-mode escape hatch and labels
      sample data explicitly
- [x] `AdvisoryNotice` component for trust/security/readiness surfaces


## AI prompt-injection hardening


- [ ] `docs/PROMPT_INJECTION_DEFENSES.md`
- [ ] Untrusted-input framing in every AI prompt
- [ ] Secret-redaction helper before AI calls
- [ ] Prompt-injection test fixtures (issue / PR / docs / changelog)
- [ ] Output validation: schema, length, confidence bounds, safe fallback
- [ ] AI provenance display in UI (source, time, model status, limits)

## P4 — GitHub write safety

- [ ] `docs/GITHUB_WRITE_SAFETY.md`
- [ ] Centralized write module on the server
- [ ] Server-side invariants: confirm flag, access, permissions, draft
      status, duplicate check, draft-only releases
- [ ] Mocked-fetch integration tests: issue comment, label apply, PR
      comment, draft release, permission failure, duplicate, API failure,
      rate-limit
- [ ] Dry-run mode (preview without writing)
- [ ] Rollback guidance per write surface
- [ ] Audit-log states: attempted, succeeded, failed, duplicate-blocked,
      permission-denied

## P5 — Observability and operations

- [ ] Health endpoint (booleans only)
- [ ] Structured logging guidelines
- [ ] Optional error-tracking integration (off by default)
- [ ] Per-user AI generation limits
- [ ] GitHub sync throttling
- [ ] `docs/OPERATIONS_RUNBOOK.md`
- [ ] Alerting checklist

## P6 — Account lifecycle and privacy

- [ ] Session failure handling tests
- [ ] Account disconnect flow (revoke + delete token + draft policy)
- [ ] Repo disconnect flow (remove membership, stop sync, hide data)
- [ ] Data deletion policy + endpoint
- [ ] `docs/PRIVACY_AND_DATA_HANDLING.md`
- [m] Verify production Supabase Auth redirect URLs

## P7 — Full test strategy

- [ ] Vitest unit tests expanded (env, demo, schemas, queue, report,
      permissions, redaction)
- [ ] Integration tests: RLS, server functions, GitHub mocked, AI mocked
- [ ] Playwright E2E: demo, setup, login failure, approval queue,
      readiness export, publish dialog (mocked confirm)
- [ ] Security tests: secret redaction, prompt injection, cross-user RLS,
      token table denial, no client import of server-only files
- [ ] CI job for E2E (PR or nightly)

## P8 — Supply chain

- [m] Enable GitHub private vulnerability reporting
- [m] Enable secret scanning + push protection
- [m] Enable CodeQL / default code scanning
- [m] Enable Dependabot alerts
- [ ] `.github/dependabot.yml` for npm + actions
- [ ] Pin GitHub Actions to versions or SHAs
- [ ] `docs/SUPPLY_CHAIN_SECURITY.md`
- [ ] License review policy

## P9 — Sensitive-repository mode

- [ ] Read-only + metadata-only default for new repo connections
- [ ] AI opt-in flag per repository
- [ ] Publishing-enabled flag per repository (off by default)
- [ ] Metadata-only AI mode (no body text sent)
- [ ] Local redaction preview before AI processing
- [ ] UI: data-stored / data-sent / permissions / disconnect explainer
- [ ] Global panic switches: AI off, publishing off, sync off
- [ ] Tests for default-deny behavior

## P10 — External review and launch gate

- [ ] All P0 gates green
- [ ] Staging E2E pass
- [ ] Sandbox GitHub repo write test
- [ ] Dependency / security scan clean
- [m] External developer / security review
- [ ] Findings triaged and closed (or explicitly accepted with rationale)
- [ ] `docs/PRODUCTION_RELEASE_DECISION.md` signed by owner

## Manual owner tasks summary

These cannot be automated from inside the app and must be done by a human
with the right GitHub / Supabase / hosting access:

- Create and configure the GitHub App (P1)
- Provide a Postgres test environment or accept CI service container (P2)
- Verify production Supabase Auth redirect URLs (P6)
- Enable GitHub repository security features (P8)
- Capture screenshots from demo mode
- Verify the hosted demo URL
- Create a v0.1.0 pre-release (draft, not published)
- Run / commission an external review (P10)
- Sign off `PRODUCTION_RELEASE_DECISION.md`
