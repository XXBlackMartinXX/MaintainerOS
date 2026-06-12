# Claude for Open Source — Application Materials

Reviewer-facing application notes for Anthropic's Claude for Open Source
program. This document is the source of truth for how MaintainerOS
positions itself; copy from here when filling in the official application
form. Do not submit verbatim without a final human review.

> **Status disclaimer.** MaintainerOS is an initial public preview. We do
> not claim to meet any publicly stated star, download, or adoption
> threshold unless verified directly from GitHub or npm at submission
> time. Nothing in this document implies that Anthropic has reviewed,
> partnered with, or approved MaintainerOS.

## 1. Project summary

- **Project name:** MaintainerOS
- **Repository:** https://github.com/XXBlackMartinXX/MaintainerOS
- **License:** MIT
- **Version:** 0.1.0 (initial public preview, pre-1.0)
- **Maintainer:** project owner listed on the GitHub repository
- **Primary users:** GitHub maintainers and small open-source teams
- **Maturity:** initial public preview — functionally complete across the
  core workflow, but pre-1.0 and not production-tested at scale

## 2. Why this project matters

Open-source maintainers carry a recurring operational load that scales
poorly with project size:

- **Issue triage burden.** New issues arrive faster than maintainers can
  classify, label, and reply to them.
- **PR review context switching.** Reviewing a pull request requires
  reconstructing intent, risk, and breaking-change surface from the diff.
- **Release / changelog / documentation drift.** Release notes,
  changelogs, README sections, and contributor guides fall behind the
  code.
- **Repository readiness and security hygiene.** SECURITY.md,
  CONTRIBUTING.md, CODE_OF_CONDUCT.md, and release process documents are
  uneven across projects.
- **Need for _safe_ AI assistance.** Existing tools either fully automate
  these actions (and post low-quality output to real issues) or do not
  exist at all. Maintainers cannot afford an AI that acts on their
  behalf without review.

MaintainerOS sits in the middle: it generates editable drafts and only
writes to GitHub after the maintainer clicks, confirms, and reviews a
preview.

## 3. What MaintainerOS does today

Implemented and shipped in the public preview:

- Demo mode with clearly-labeled sample data (no real GitHub or Supabase
  needed to evaluate the UI).
- GitHub OAuth sign-in via Supabase Auth, plus on-demand repository sync.
- AI-assisted issue triage drafts (type, severity, priority, suggested
  labels, suggested reply).
- AI-assisted pull request summary drafts (risk, breaking-change signals,
  changelog line).
- Changelog / release-note drafts grouped by Added / Changed / Fixed.
- Documentation draft generator (README sections, CONTRIBUTING, SECURITY,
  CODE_OF_CONDUCT, issue / PR templates, maintainer and release guides).
- Approval-gated GitHub publishing for issue comments, label apply, PR
  comments, and releases (releases are created as drafts).
- Audit log of AI actions and publish events.
- Approval Queue aggregating pending drafts across triage, PR summaries,
  releases, and documentation.
- Repository health and open-source readiness checks (advisory).
- Exportable Markdown maintainer report (advisory).
- `/setup` diagnostics for required environment configuration.
- Threat model and security review checklist.
- CI workflow and a deterministic Vitest suite (80 tests at the time of
  writing) covering pure helpers, schemas, demo mode, publish helpers,
  GitHub write permission evaluation, repo-health classification,
  approval-queue filtering, maintainer report generation, setup checklist
  classification, static RLS policy invariants, safe-client behaviour, and
  user-facing copy / overclaiming-language invariants.

## 4. Safety and human-approval model

MaintainerOS is built to assist maintainers, not to act on their behalf.

- **AI outputs are drafts.** Nothing is generated and posted in one step.
- **GitHub writes require explicit confirmation** via a preview dialog.
- **Releases are created with `draft: true` server-side.** MaintainerOS
  never publishes a non-draft release.
- **GitHub tokens stay server-side**, accessed via server functions.
- **The Supabase service role key stays server-side** and is only used
  inside `*.server.ts` modules loaded from server function handlers.
- **Audit logs** record AI actions and publish attempts.
- **Demo mode is isolated** — it never touches a real GitHub repository
  and is clearly badged in the UI.
- **Security and readiness reports are advisory**, not formal audits.

See [`AI_SAFETY.md`](./AI_SAFETY.md), [`SECURITY_MODEL.md`](./SECURITY_MODEL.md),
[`THREAT_MODEL.md`](./THREAT_MODEL.md), and
[`SECURITY_REVIEW_CHECKLIST.md`](./SECURITY_REVIEW_CHECKLIST.md).

## 5. Current evidence of seriousness

Only verified artifacts are listed here — no fabricated metrics.

- Public GitHub repository under the MIT license.
- CI workflow running typecheck, lint, tests, and build on every change.
- 80 deterministic unit tests (Vitest) — no live network calls.
- Static RLS policy invariants enforced in CI (`bun run check:rls`).
- Copy-safety invariants in CI: a `FORBIDDEN_COPY` lint scans every
  shipped source file for overclaiming language.
- Threat model and security review checklist committed to the repo.
- Row-Level Security documentation for every public-schema table.
- AI safety documentation describing the draft-only / approval-gated
  model.
- Testing documentation for contributors.
- Public preview documentation: `README.md`, `MAINTAINER_HANDOFF.md`,
  `ROADMAP.md`, this application document.
- No claimed adoption, stars, downloads, sponsors, or paying users.
- No claim of production readiness.

## 6. How Claude would help

Specific, scoped uses inside the MaintainerOS codebase:

- Improve code quality and refactors in a maintainer-tool codebase that
  values correctness over cleverness.
- Expand integration and end-to-end test coverage, especially around
  routes that currently rely on pure-helper unit tests.
- Harden RLS and access-control tests against a real Postgres.
- Improve GitHub integration mocks and add contract tests for the
  approval-gated publish path.
- Refine AI prompts and Zod schemas to make drafts more reviewable and
  less ambiguous.
- Improve docs, onboarding, and `/setup` clarity.
- Review security-sensitive changes (migrations, RLS policies, server
  functions touching tokens or roles).
- Accelerate responsible OSS-maintainer tooling more broadly, in line
  with the project's draft-only, human-approval-first ethos.

## 7. What Claude would not be used for

- No autonomous publishing to GitHub or any external system.
- No bypassing the human approval / confirmation dialog.
- No secret handling shortcuts (no logging, echoing, or returning
  secrets).
- No generating fake traction, stars, downloads, users, or testimonials.
- No replacement for human security review of security-sensitive code.

## 8. Current limitations (honest)

- We have not verified that MaintainerOS meets any public high-traction
  eligibility metrics for the program. If the program requires verified
  thresholds, treat this application as an early-stage submission.
- Public preview only — not production-ready.
- Public screenshots are still pending.
- No live OAuth end-to-end test yet.
- No RLS integration test against a real database yet.
- No GitHub-write integration test (mocked only).
- No formal third-party security audit.
- Repository file contents are not yet fully inspected by readiness
  signals — they rely on metadata plus AI draft presence.
- The setup checklist helper is implemented but not yet fully wired into
  the `/setup` UI.

## 9. Requested consideration

We are asking Anthropic to consider MaintainerOS as an **early-stage
open-source maintainer-support tool** aligned with responsible AI
workflows for open-source maintainers: drafts only, human approval
required, audit logs, demo mode for safe evaluation, and cautious
advisory framing on security and readiness signals.

If MaintainerOS does not currently meet the program's public traction
thresholds, we still believe the project's safety-first design and
day-to-day usefulness to maintainers make it worth consideration.
