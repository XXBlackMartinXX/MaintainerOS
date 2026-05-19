# Changelog

All notable changes to MaintainerOS are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v0.1.0 — Initial public preview

First public preview of MaintainerOS. Functionally complete across the core
maintainer workflow, but pre-1.0 and not production-tested at scale.

### Added

- GitHub OAuth sign-in via Supabase Auth
- Repository connection and on-demand sync of issues, pull requests,
  contributors, labels, and releases
- Live Issues, Pull Requests, Contributors, and Repo Health pages
- AI issue triage drafts (type, severity, priority, labels, suggested reply)
- AI pull request summary drafts (risk, breaking-change detection, changelog
  entry)
- AI changelog generator grouped by Added / Changed / Fixed
- AI documentation generator (README, CONTRIBUTING, SECURITY, and more) with
  confidence scores and missing-context notes
- Approval-gated GitHub write actions: issue replies, label apply, PR
  comments, and draft release creation
- Duplicate-post protection backed by `github_publish_events`
- AI Action Log with filter chips, status badges, and publish-event
  enrichment
- Demo mode with global banner and disabled publish/sync controls
- First-run product tour, restartable from Settings
- Trust Center and internal QA Checklist pages
- Open-source readiness checklist and security readiness review

### Security & safety

- All AI calls run server-side via managed AI gateway; no provider keys in
  the browser
- All GitHub writes require an approved or edited draft, an explicit click,
  a confirmation dialog, and a duplicate check
- GitHub releases are always created as drafts (`draft: true`)
- Row-level security on all user-data tables; repo data scoped to members
- No automatic commenting, labeling, merging, closing, or release
  publishing
- No analytics or third-party tracking on the public landing page

### Documentation

- Architecture, Security Model, AI Safety, Demo Mode, Local Development,
  Database, Supabase RLS, Roadmap, Troubleshooting, and Release Checklist
  guides under `docs/`
- Maintainer handoff guide and launch post drafts

### Known limitations

- Documentation drafts are copied manually; there is no automatic commit or
  pull-request creation
- Security readiness signals are heuristics, not guarantees
- Repository health scores are advisory and based on synced data only
- Sync is on-demand only; no background polling or webhooks yet
- Single GitHub account per account (Lovable platform limitation)
- No production adoption claims — this is an initial public preview
