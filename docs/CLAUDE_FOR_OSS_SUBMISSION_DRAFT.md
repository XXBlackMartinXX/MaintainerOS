# Claude for OSS — Submission Draft

> **This is a draft.** Adapt the wording to the current Anthropic
> application form before submitting. Do not assert any claim that is
> not currently true of this repository. The owner is responsible for
> verifying the **Current limitations** section still matches reality
> at submission time.
>
> **Do not** add the phrases "Anthropic approved", "Anthropic
> partnership", "officially endorsed", "production-ready",
> "vulnerability-free", or any unverified adoption metric. The
> `check:claims` scan exists to catch these.

## Project name

MaintainerOS

## Public repository

<https://github.com/XXBlackMartinXX/MaintainerOS>

## Public preview

<https://maintainer-os.lovable.app/demo>

Demo mode uses clearly labeled sample data and does not call GitHub or the
AI gateway. Repo-only review is possible, but the application is stronger
with this verified public demo and its sample-data screenshots available.

## One-sentence summary

An honest, AI-assisted operations center for open-source maintainers,
where every AI output is an editable draft and every GitHub write
requires an explicit human approval.

## Project summary (longer)

MaintainerOS helps a maintainer triage issues, summarize pull requests,
draft changelogs and documentation, and run repo-health checks against
their own GitHub repositories. The product enforces a strict
"AI-assisted, human-approved" model: AI never writes to GitHub, never
publishes a release, and never bypasses the approval queue. Every
GitHub-write surface is draft-backed, duplicate-checked, and audited.
Releases created from the app are always created with `draft: true`.

The project is currently a **public preview**. Several owner-run
verification steps and an external review are explicitly tracked as
pending in the repository's own documentation.

## Maintainer role

Solo maintainer / project owner.

## What the project does

- Connects to a maintainer's GitHub repositories through OAuth.
- Syncs issues, pull requests, and metadata into a Supabase project
  protected by row-level security.
- Generates AI **drafts** for issue triage, PR summaries, changelogs,
  and documentation.
- Surfaces a single **approval queue** where the maintainer reviews,
  edits, and explicitly approves each draft before any GitHub write.
- Performs the approved write (issue comment, label apply, PR comment,
  draft release) only after a confirmation dialog showing the exact
  payload, with duplicate-publish protection and an audit row per
  attempt.
- Provides a maintainer report export and a repo-health advisory
  view.

## Why it matters to open-source maintainers

Maintainer time is the scarcest resource in open source. Existing
AI-assisted tools tend to either (a) act autonomously on GitHub in ways
maintainers cannot fully audit, or (b) require trusting opaque agents
with broad token scopes. MaintainerOS is built on the opposite
assumption: AI helps draft, the maintainer decides, and every action is
auditable.

## Safety model (concrete, not aspirational)

- AI outputs are **drafts only**. There is no AI-triggered write path.
- Every GitHub write is approval-gated and goes through
  `src/lib/github/write.server.ts`, the single chokepoint.
- Releases are hardcoded `draft: true` server-side.
- Service-role credentials are confined to `*.server.ts` modules and
  loaded lazily inside privileged handlers. They never reach the client
  bundle.
- The token table (`user_github_tokens`) has zero RLS policies for
  `anon` or `authenticated`; access is strictly server-side.
- Row-level security policy structure is asserted in CI by
  `bun run check:rls`, and a runtime harness against a local Postgres
  exists at `bun run test:rls:runtime`.
- A public-claims scanner (`bun run check:claims`) blocks forbidden
  marketing language from entering the repo.
- A repo-operations scanner (`bun run check:repo`) verifies that the
  governance, workflow, and operations files we commit to maintaining
  actually exist.
- Demo mode is fully read-only and labeled with a persistent banner.
- Live AI calls and live GitHub writes are not exercised in CI; they
  require explicit owner-run verification against a non-sensitive test
  repository (`docs/SANDBOX_VERIFICATION.md`).

## Testing, CI, and security work completed

- 97 unit / integration tests passing across 19 files.
- CI runs typecheck, tests, static RLS checks, public-claims scan,
  repo-operations scan, and a production build on every PR and push to
  `main`.
- CodeQL with `security-extended` queries runs weekly and on every PR.
- Dependency review runs on every PR.
- Dependabot covers npm and GitHub Actions with grouped weekly
  updates.
- Threat model, security model, AI-safety, RLS access-control,
  integration-boundaries, sandbox-verification, repository-operations,
  release-operations, and external-review docs are all in-repo under
  `docs/`.

## Current limitations (read before submitting)

- **Public preview**, not production. `docs/PRODUCTION_READINESS.md`
  enumerates the open gates.
- No formal third-party security audit has been performed.
- No live OAuth, live GitHub-write, or live AI integration tests in
  CI; those are owner-run.
- Runtime RLS verification is owner-run, not yet a required CI step.
- No Playwright / browser E2E suite.
- The GitHub OAuth scope model is broader than ideal for sensitive
  repositories; a GitHub App migration is planned and documented but
  not yet implemented.
- No adoption metrics are claimed. If the application form requires
  stars / downloads / active users, leave those fields empty or write
  "Not yet measured" rather than fabricate a number.
- The project does not claim to meet any large-star, download, or usage
  threshold. The owner must answer eligibility fields from current,
  independently verified repository data.

## How Claude would help

Concrete, scoped uses:

1. **Issue triage drafts** — Claude proposes a label set, severity,
   suggested next action, and a reply that the maintainer edits and
   approves before posting.
2. **PR summary drafts** — Claude reads a diff and produces a
   reviewer-friendly summary plus risk/test notes; the maintainer
   approves before commenting.
3. **Changelog drafts** — Claude reads a window of merged PRs and
   produces a `CHANGELOG.md` entry the maintainer edits before
   release.
4. **Documentation drafts** — Claude proposes README, CONTRIBUTING, or
   docs-page improvements as text the maintainer pastes after review.
5. **Repo-health narratives** — Claude turns the structured
   repo-health signals into a short, human-readable advisory.

In every case, Claude is a drafting collaborator. The maintainer is
the sole approver. No Claude path acts on GitHub.

## What we are explicitly not claiming

- Not production-ready.
- Not externally audited.
- Not Anthropic-approved or endorsed.
- Not battle-tested.
- No specific user count, star count, download count, or testimonial.
- No autonomous behavior.

## Suggested attachments

- The hosted public preview: <https://maintainer-os.lovable.app/demo>.
- `docs/screenshots/dashboard-demo.png`, showing demo mode with its banner.
- `docs/screenshots/repo-health.png`, showing advisory sample-data signals.
- `docs/screenshots/audit-log.png`, showing illustrative demo events.
- `docs/screenshots/setup-diagnostics.png`, showing redacted configuration
  statuses only.
- A link to `docs/FINAL_READINESS_REPORT.md`.
- A link to `docs/EXTERNAL_REVIEW.md`.

## Copy into the Anthropic form

Use this compact block only after checking the form's current wording and
verifying that the limitations above still match the repository.

- **Project name:** MaintainerOS
- **Public repo URL:** <https://github.com/XXBlackMartinXX/MaintainerOS>
- **Summary:** MaintainerOS is an open-source operations dashboard for
  GitHub maintainers. Claude helps draft issue triage, PR summaries,
  changelogs, documentation, and repo-health narratives; every output is
  editable, every GitHub write requires explicit human approval, and every
  attempt is audit-logged.
- **Maintainer role:** Solo maintainer / project owner.
- **Why it matters:** It reduces repetitive maintenance work without
  delegating repository decisions or publishing authority to an AI system.
- **How Claude helps:** Claude acts as a drafting collaborator for triage,
  review summaries, changelogs, documentation, and advisory narratives.
  The maintainer remains the sole approver.
- **Current limitations:** Public preview; no formal third-party security
  audit; live OAuth, GitHub-write, and AI checks are owner-run; runtime RLS
  is owner-run rather than required CI; no browser E2E suite; sensitive
  repositories are not recommended under the current OAuth scope model;
  adoption and eligibility metrics are not claimed.
