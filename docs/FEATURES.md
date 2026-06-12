# MaintainerOS Features

Public preview. Advisory tooling for open-source maintainers. Not a substitute
for formal security audits, compliance certifications, or production sign-off.

## A. Evidence-based Repo Health Center

Every check in the health center carries:

- **Status** — `present`, `partial`, `missing`, or `not_verified`.
- **Confidence** — `high` / `medium` / `low`.
- **Evidence** — what MaintainerOS actually inspected.
- **Limitation** — what MaintainerOS did **not** inspect.
- **Next action** — a concrete maintainer step.

Checks include AI-draft availability for README, CONTRIBUTING, CODE_OF_CONDUCT,
SECURITY, issue/PR templates, release process, maintainer guide, and
contributor onboarding, plus advisory artifact checks (LICENSE, CI workflow,
CHANGELOG, dependency manifest, `.env.example`, screenshot/docs assets,
testing docs, RLS/access-control docs, production-readiness docs).

**Limitation:** MaintainerOS does not yet read repository file contents. AI
drafts are *not* proof that the file is committed. Artifact checks are marked
`not_verified` until live repo-content reading lands.

## B. Central Approval Queue

`/app/approval-queue` aggregates pending and recent AI drafts across issue
triage, PR summaries, release drafts, and documentation drafts. Every
publish action still goes through the per-source server function and the
`PublishConfirmDialog`. Nothing publishes from the queue without an explicit
human confirmation step.

## C. Exportable Maintainer Report

A Markdown report can be generated from the current repo's advisory checks,
pending drafts, recent audit entries, and known limitations. The report:

- Is generated client-side from already-loaded data.
- Carries an explicit "Advisory report" disclaimer.
- Labels demo runs as demo data.
- Never includes secrets, tokens, session data, or raw request logs.

See `docs/MAINTAINER_REPORT.md`.

## D. Setup Wizard

`/setup` shows a guided, configured/missing checklist covering client and
server Supabase env vars, the AI gateway, the GitHub OAuth provider, redirect
URLs, OAuth scopes, deployment URL, and demo-mode verification. The wizard
shows booleans only — never secret values. Future GitHub App readiness is
scaffolded but not yet consumed at runtime. See `docs/SETUP_WIZARD.md`.

## E. AI draft explainability

Every AI draft is labelled **"AI draft — review before publishing"** and is
accompanied by rationale, inputs used, a verification checklist, and a risk
band derived from model confidence when available. AI drafts are never
never approved or published automatically. Releases are always created as GitHub
draft releases.
