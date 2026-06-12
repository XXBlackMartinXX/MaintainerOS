# Final Readiness Report

Single-document snapshot of MaintainerOS at the end of the P0–P9
production-readiness program. This file is the source of truth for the
question *"what state is the project in right now?"* and is intended to
be read end-to-end by the maintainer and by any external reviewer.

> **Honest status, in one sentence.** MaintainerOS is a **public preview**.
> Automated quality gates pass and a public demo is live; live-service
> verification, owner GitHub-UI settings, screenshots, and external review remain before any
> stronger claim.

## 1. Status at a glance

| Track | Status | Notes |
| --- | --- | --- |
| Public preview | **Live** | Public demo at `https://maintainer-os.lovable.app/demo`; owner GitHub-UI settings and screenshots remain. |
| v0.1.0 draft release | **Manual verification required** | Notes drafted; release stays draft until gates in §7 are green. |
| Claude-for-OSS submission | **Mostly ready** | Draft application in `docs/CLAUDE_FOR_OSS_SUBMISSION_DRAFT.md`. Owner must verify limitations section before submitting. |
| Production use | **Blocked** | See `docs/PRODUCTION_READINESS.md`. P0 gates incomplete. |
| Sensitive repositories | **Not recommended** | Awaiting GitHub App migration (`docs/GITHUB_APP_MIGRATION_PLAN.md`) and least-privilege scopes. |

## 2. What is ready

### Product surface
- Demo mode with persistent banner (`/demo`).
- Setup wizard reporting booleans only (`/setup`).
- Repo health / advisory checks (`src/lib/repo-health/`).
- Approval queue with explicit human confirmation
  (`src/lib/approval-queue/`).
- Maintainer report export (`src/lib/reports/`).
- AI draft explainability (`src/lib/ai/explainability.ts`).
- Approval-gated publishing — every GitHub write is draft-backed,
  user-confirmed, duplicate-checked, and audit-logged
  (`src/lib/github/write.server.ts`).
- Releases hardcoded `draft: true` server-side.
- Audit log for every write attempt.

### Testing / CI (all required to pass in `.github/workflows/ci.yml`)
- `bun run typecheck`
- `bun run test` — **97/97 passing across 19 files**
- `bun run check:rls` — 9 migrations, 27 policies asserted
- `bun run check:claims` — repository-wide forbidden-language scan
- `bun run check:repo` — required files / structural markers
- `bun run build`
- **CodeQL** weekly + on PR/push (`.github/workflows/codeql.yml`).
- **Dependency review** on PRs (`.github/workflows/dependency-review.yml`).
- **Dependabot** weekly for npm + GitHub Actions
  (`.github/dependabot.yml`).
- Owner-run runtime RLS harness: `bun run test:rls:runtime`.
- Owner-run sandbox preflight: `bun run sandbox:preflight` (never
  prints secret values).

### Security / trust posture
- RLS enabled on every user-data table; static structural checks
  enforced in CI; runtime harness available to owner.
- `user_github_tokens` has **zero** policies for `anon`/`authenticated`;
  access is server-only via `supabaseAdmin`.
- Service-role client only imported from `*.server.ts` modules, and
  lazily inside privileged handlers — never at module scope in route
  or `*.functions.ts` files.
- AI provider boundary tested: missing keys raise `AIConfigError`
  without a network call.
- Setup status redaction unit-tested (no secret values returned).
- GitHub OAuth scope model documented; GitHub App migration plan
  written for sensitive-repo path.
- Threat model and security model docs present.
- Advisory wording enforced by `check:claims`.
- `SECURITY.md` describes private disclosure with safe-harbor.

### Release / operations docs
- `docs/RELEASE_NOTES_v0.1.0.md`
- `docs/RELEASE_CHECKLIST.md`
- `docs/RELEASE_OPERATIONS.md`
- `docs/OWNER_LAUNCH_CHECKLIST.md`
- `docs/REVIEWER_WALKTHROUGH.md`
- `docs/DEMO_SCRIPT.md`
- `docs/screenshots/README.md`
- `docs/REPOSITORY_OPERATIONS.md`
- `docs/EXTERNAL_REVIEW.md`
- `docs/FINAL_OWNER_ACTIONS.md` (this phase)
- `docs/CLAUDE_FOR_OSS_SUBMISSION_DRAFT.md` (this phase)

## 3. What is **not** ready

- Owner has not yet enabled private vulnerability reporting, secret
  scanning, push protection, Dependabot alerts/security updates,
  CodeQL alerts surface, or branch protection in the GitHub UI.
- No screenshots committed yet.
- No live OAuth / live GitHub / live AI integration tests in CI.
- No Playwright / browser E2E.
- No formal third-party security review.
- Runtime RLS harness is owner-run, not a required CI step.
- Public demo is live at `https://maintainer-os.lovable.app/demo` and the
  base URL is configured in `src/lib/project-meta.ts`.
- `.github/FUNDING.yml` placeholders commented out (intentional).
- `SECURITY.md` uses neutral private-disclosure guidance; private
  vulnerability reporting still needs owner confirmation in GitHub.

## 4. Automated checks and commands

| Command | Purpose |
| --- | --- |
| `bun install --frozen-lockfile` | Deterministic install |
| `bun run typecheck` | TypeScript strict |
| `bun run test` | Unit + integration (vitest) |
| `bun run check:rls` | Static RLS policy invariants |
| `bun run check:claims` | Forbidden public-language scan |
| `bun run check:repo` | Required workflows/docs/templates present |
| `bun run build` | Production build (Cloudflare worker target) |
| `bun run sandbox:preflight` | Local config classifier (no secrets printed) |
| `bun run test:rls:runtime` | Owner-run runtime RLS against local Postgres |

## 5. Manual verification still required

See `docs/FINAL_OWNER_ACTIONS.md` for the exact ordered list. Summary:
GitHub-UI security toggles, branch protection, sandbox verification
against a non-sensitive test repo, screenshot capture, release notes
review, draft pre-release.

## 6. Security posture summary

- **Cannot autonomously act.** No AI path writes to GitHub or publishes
  a release. Every write is approval-gated.
- **Cannot publish a non-draft release.** Hardcoded `draft: true`.
- **Cannot expose service-role to client.** Enforced by file-naming
  convention plus tests.
- **Cannot leak GitHub tokens.** Token table is server-only;
  `disconnectRepository` and `connectRepositories` are scoped to the
  authenticated user.
- **Cannot make claims we have not verified.** Enforced by
  `check:claims`.

## 7. Release readiness

`v0.1.0` is **draft-ready**, not publish-ready. Gates before publishing
the draft:

1. CI green on `main` for the commit being tagged.
2. Owner GitHub-UI settings from `docs/REPOSITORY_OPERATIONS.md` §1–§3
   enabled.
3. Sandbox verification per `docs/SANDBOX_VERIFICATION.md` completed
   against a non-sensitive test repository.
4. Runtime RLS harness run locally and green.
5. Screenshots captured per `docs/screenshots/README.md`.
6. Release notes reviewed and matched to `docs/RELEASE_NOTES_v0.1.0.md`
   verbatim.
7. `check:claims` clean for any newly written marketing or launch
   copy.

## 8. Production readiness

Blocked. `docs/PRODUCTION_READINESS.md` is the source of truth. The
"Language we will not use" section there continues to apply.

## 9. Claude-for-OSS readiness

The submission draft is at `docs/CLAUDE_FOR_OSS_SUBMISSION_DRAFT.md`.
It is **ready for owner review and adaptation**, not for automatic
submission. The owner must, before submitting:

- Confirm the limitations section still matches reality.
- Confirm no metric (stars, downloads, users) is asserted that has not
  been measured.
- Confirm no "Anthropic approved" or "production-ready" phrasing has
  been added during adaptation.
- Capture at least one screenshot showing demo mode and one showing the
  approval queue.

## 10. Recommended next steps for the owner

The ordered sequence is in `docs/FINAL_OWNER_ACTIONS.md`. The short
version: enable GitHub-UI gates → branch protection → sandbox
verification → screenshots → review release notes → create draft
pre-release → (optionally) submit Claude-for-OSS draft.
