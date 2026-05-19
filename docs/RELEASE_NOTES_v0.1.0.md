# MaintainerOS v0.1.0 — Initial public preview

This is the first public preview of **MaintainerOS**, an honest,
AI-assisted operations center for open-source maintainers.

Everything in this release is functionally complete across the core
maintainer workflow, but the project is pre-1.0 and has not been deployed
to a production maintainer team at scale. There are no adoption claims.

## What's inside

- **Live GitHub sync** — issues, pull requests, contributors, labels, and
  releases for repositories you connect.
- **AI issue triage** — type, severity, priority, suggested labels, and a
  suggested reply. Drafts only.
- **AI PR summaries** — risk, breaking-change detection, and a changelog
  line. Drafts only.
- **AI changelog generator** — grouped by Added / Changed / Fixed. Drafts
  only.
- **AI documentation generator** — README, CONTRIBUTING, SECURITY, and
  more, with confidence and missing-context notes. Drafts only.
- **Approval-gated GitHub publishing** — post issue replies, apply labels,
  post PR comments, and create draft releases, only after an explicit
  click and confirmation.
- **Audit log** — every AI action and GitHub publish event is recorded.
- **Demo mode** — explore the product with clearly-labeled sample data,
  no GitHub connection required.
- **Trust Center & Readiness Checklist** — transparent documentation of
  what is read, stored, and written.

## Safety model

- AI calls run server-side through Lovable AI Gateway. No provider keys are
  exposed to the browser.
- GitHub writes require: an approved or edited draft, a user click, a
  confirmation dialog, and a duplicate-protection check.
- Releases are always created as `draft: true`.
- Row-level security on all user-data tables.
- No automatic commenting, labeling, merging, closing, or release
  publishing.

## Setup

See [`docs/LOCAL_DEVELOPMENT.md`](./LOCAL_DEVELOPMENT.md) for the full setup
walkthrough. Short version:

1. Enable Lovable Cloud on the project (Supabase Auth, Database, AI Gateway).
2. Configure a GitHub OAuth App and add it as a Supabase Auth provider.
3. Apply the Supabase migrations in `supabase/migrations/`.
4. Run `bun install && bun run dev`.

Environment variables are documented in `.env.example`. Public values are
auto-injected by Lovable Cloud.

## Known limitations

- Documentation drafts are copied manually; no auto-commit or PR creation
  yet.
- Security readiness is a heuristic, not a guarantee.
- Repository health scores are advisory.
- Sync is on-demand only; no background polling or webhooks.
- One GitHub account per Lovable account (platform limitation).

## Recommended next steps

- Connect a small, low-traffic repository first.
- Try issue triage and PR summaries on existing closed items before using
  them on active threads.
- Test GitHub write actions in a sandbox repository before enabling them
  on your main project.
- File issues and feedback on the public repository.

Thanks for trying the preview. Feedback is very welcome.
