# Project impact

This document describes the problem MaintainerOS addresses, who it helps,
what it currently does, and what is intentionally out of scope. It avoids
adoption claims, fabricated metrics, and production-readiness
overstatements.

## The problem for OSS maintainers

Open-source maintainers spend a disproportionate share of their time on
repetitive operational work:

- Triaging new issues — classifying type, severity, priority, labels,
  and drafting first-touch replies.
- Reviewing pull requests — reconstructing intent, risk surface, and
  breaking-change implications.
- Keeping release notes, changelogs, README sections, contributor
  guides, and security documents up to date.
- Maintaining basic repository hygiene: SECURITY.md, CONTRIBUTING.md,
  CODE_OF_CONDUCT.md, issue and PR templates.
- Resisting the temptation to fully automate any of the above with AI
  that posts directly to real users on real projects.

## Why maintainer operations matter

The cost of low-quality maintainer output is high: bad triage replies
erode contributor trust, hasty PR comments cause regressions, and
neglected documentation discourages first-time contributors. Tools that
reduce this load _without_ removing the human from the loop have
outsized leverage on the open-source ecosystem.

## Who benefits

- Solo maintainers of small-to-medium GitHub projects.
- Small OSS teams who share triage and review duties.
- Maintainers evaluating whether AI can help their workflow without
  giving up control.

## What MaintainerOS currently helps with

- Generating editable drafts for issue triage, PR summaries, changelogs,
  release notes, and documentation.
- Surfacing pending drafts in a single Approval Queue.
- Producing an advisory Markdown maintainer report covering readiness,
  audit activity, and next actions.
- Highlighting repository readiness gaps with cautious, evidence-based
  signals.
- Providing `/setup` diagnostics so self-hosters can see what is
  configured and what is missing.
- Demo mode for evaluating the product without touching real
  repositories.

## What is intentionally safety-gated

- **No autonomous GitHub writes.** Every publish action requires an
  explicit confirmation dialog with a preview.
- **Releases are always created as drafts** server-side.
- **AI output is never posted in one step.** It is always a draft that a
  maintainer can edit before publishing.
- **Tokens and service-role keys stay server-side.**
- **Security and readiness signals are advisory**, not certifications.

## Near-term roadmap

See [`ROADMAP.md`](./ROADMAP.md). Highlights:

- v0.2.0: smoke tests for every route, self-hosting docs, friendlier
  `/setup` diagnostics, mobile and accessibility passes.
- v0.3.0: hosted demo deployment, richer demo data, onboarding tour and
  empty-state improvements.

## Long-term vision

A maintainer-side operating layer for open source where every AI
suggestion is reviewable, every external action is approved, and every
publish is auditable — useful enough that maintainers reach for it on
real projects, careful enough that they trust it to do so.

## Honest limitations

- Pre-1.0, public preview. Interfaces and schemas may change.
- No claimed adoption, stars, downloads, sponsors, or paying users.
- No live OAuth or GitHub-write integration tests; helpers are covered
  by pure-function unit tests.
- No RLS integration test against a real Postgres yet.
- No formal third-party security audit.
- Repository readiness signals are heuristics, not guarantees.

## How contributors can help

- Try MaintainerOS on a non-critical repository and file issues against
  the templates in `.github/ISSUE_TEMPLATE/` (where available).
- Improve route-level smoke tests and integration tests.
- Strengthen RLS tests and GitHub publish-path mocks.
- Improve documentation, especially `/setup` and self-hosting guides.
- Suggest AI prompt and schema refinements that make drafts easier to
  review.

See [`GOOD_FIRST_ISSUES.md`](./GOOD_FIRST_ISSUES.md) for entry points.
