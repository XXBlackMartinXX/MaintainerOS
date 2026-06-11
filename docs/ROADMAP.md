# Roadmap

This roadmap is honest about what exists today versus what is planned.
MaintainerOS is pre-1.0. Nothing here is a commitment or a delivery date —
items move down the list as they ship.

## v0.1.0 — Initial public preview (current)

What you can do today:

- GitHub OAuth sign-in via Supabase Auth
- On-demand sync of issues, PRs, contributors, labels, releases
- AI issue triage drafts (type, severity, priority, labels, suggested reply)
- AI PR summary drafts (risk, breaking-change signals, changelog line)
- AI changelog and documentation drafts
- Approval-gated GitHub write actions (issue replies, label apply,
  PR comments, draft releases) with duplicate-post protection
- Full AI Action Log and publish audit trail
- Demo mode with clearly-labeled sample data
- Trust Center and readiness checklist
- Approval Queue aggregating pending AI drafts across triage, PR summaries,
  release drafts, and documentation — view-only summary; publish actions
  still happen on the source page with the confirmation dialog
- Exportable maintainer report (Markdown, advisory only)
- Vitest test suite (56 tests) covering pure helpers: AI schemas, env feature
  flags, demo mode, publish helpers, GitHub write permission evaluation,
  repo-health classification, approval-queue filtering/sorting, maintainer
  report generation, and setup checklist classification

Known gaps for this milestone:

- No live OAuth / GitHub-write integration tests
- No public screenshots captured yet
- No hosted demo deployment yet
- Sync is on-demand only
- No RLS integration test against a real database
- No formal security audit
- Repo file contents are not yet inspected — readiness signals rely on
  metadata + AI draft presence

## v0.2.0 — Stability and setup

Focus: make self-hosting and first-run smoother and harder to break.

- Smoke tests for every route in the app
- `docs/SELF_HOSTING.md` covering Cloudflare Workers, Vercel, and Fly
- Improved Supabase + GitHub OAuth setup docs with screenshots
- Friendlier `/setup` diagnostics with one-line explanations per variable
- Mobile layout pass for the dashboard
- Accessibility sweep (aria-labels on icon-only controls)

## v0.3.0 — Hosted demo and onboarding

Focus: lower the barrier to evaluating the product.

- Public hosted demo deployment with the demo banner visible
- 2–3 additional synthetic repositories in demo mode
- First-run tour improvements
- Richer empty states with next-step actions
- CODEOWNERS draft generator
- Better example security policies in the docs generator

## Future ideas (not committed)

- Directly opening pull requests from generated docs (currently copy-only)
- Repository health trends over time
- Triage rule presets per project type
- Contributor outreach helpers (welcome messages, first-time-contributor flow)
- Multi-repository dashboards
- Webhook-based incremental sync
- Bring-your-own AI provider configuration

## Explicitly out of scope

- Automatic posting to GitHub of any kind
- Automatic merging, closing, or release publishing
- Contributor scoring or ranking
- Replacing CODEOWNERS or human code review
- Fabricated metrics, stars, downloads, or testimonials

## Claude-assisted development opportunities

If MaintainerOS receives Claude for Open Source access, priority uses
are documented in
[`CLAUDE_FOR_OSS_APPLICATION.md`](./CLAUDE_FOR_OSS_APPLICATION.md):

- Expand integration and end-to-end tests around routes that currently
  rely on pure-helper unit tests.
- Add RLS integration tests against a real Postgres.
- Add contract tests for the approval-gated GitHub publish path.
- Refine AI prompts and Zod schemas for reviewability.
- Improve `/setup` clarity and self-hosting docs.

## Production-readiness blockers (current)

- No live OAuth or GitHub-write integration tests.
- No RLS integration test against a real database.
- No formal third-party security audit.
- Hosted demo deployment not yet published.
- Public screenshots pending.
