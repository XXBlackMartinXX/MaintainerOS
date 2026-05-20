# Open Source Program application notes

Reference material for applying to ecosystem programs (e.g. the Claude
Open Source Program). Copy and adapt — do not submit verbatim without a
final review.

## Project facts

- **Project name:** MaintainerOS
- **Repository:** https://github.com/XXBlackMartinXX/MaintainerOS
- **License:** MIT
- **Version:** 0.1.0 (initial public preview)
- **Status:** Public preview. Pre-1.0. No production adoption claimed.

## Short summary (≤ 350 chars)

MaintainerOS is an open-source operations dashboard for GitHub
maintainers. It uses AI to draft issue triage, PR summaries, changelogs,
and documentation, but every GitHub write requires explicit maintainer
approval. Drafts only — nothing is posted automatically.

## Problem it solves

Open-source maintainers spend a disproportionate amount of time on
repetitive triage, summarization, and documentation work. Existing tools
either fully automate these actions (and post low-quality output to real
issues) or do not exist at all. MaintainerOS sits in the middle: it
generates editable drafts and only writes to GitHub after the maintainer
clicks, confirms, and reviews a preview.

## Current status

- Functionally complete across the core maintainer workflow
- Pre-1.0; interfaces, schemas, and behaviour may change
- Not yet production-tested at scale
- No paying users, no adoption claims, no fabricated metrics

## What is implemented

- GitHub OAuth sign-in via Supabase Auth
- On-demand sync of issues, pull requests, contributors, labels, releases
- AI issue triage, PR summary, changelog, and documentation drafts
- Approval-gated GitHub writes with duplicate-post protection
- Full audit log of AI actions and publish events
- Demo mode with clearly-labeled sample data
- Row-level security on all user-data tables

## What is still preview / experimental

- No automated test suite yet (manual smoke checks only)
- Public screenshots not yet captured
- No hosted demo deployment yet
- Sync is on-demand only (no webhooks or background polling)
- Repository health and security readiness are heuristics, not guarantees

## Why maintainers may find it useful

The approval-first model means a maintainer can use AI assistance on a
real, public project without risking low-quality automated posts. Every
suggestion is a draft. Every write requires a click and a confirmation.
Releases are created with `draft: true` server-side. The audit log
records every action.

## Commitment to honest claims

MaintainerOS does not fabricate stars, downloads, users, contributors, or
activity. Cautious labels (`Live data`, `Partial data`, `Demo data`,
`AI draft`) are used wherever data confidence matters. The README, the
roadmap, and this application all describe MaintainerOS as an initial
public preview with no claimed adoption.

---

## Suggested 500-word explanation (ecosystem / discretionary)

> MaintainerOS is an open-source operations dashboard for GitHub
> maintainers. It is built around a single conviction: AI should help
> maintainers do their work, not do their work for them. Every AI output
> in MaintainerOS is an editable draft, and every action that touches
> GitHub — posting an issue reply, applying labels, commenting on a
> pull request, creating a release — requires an explicit maintainer
> click and a confirmation dialog with a preview. Releases are always
> created with `draft: true` server-side. There is no auto-post, no
> auto-label, no auto-merge, and no background job that decides anything
> on the maintainer's behalf.
>
> The product covers the parts of maintenance that are most repetitive
> and most error-prone when automated badly: issue triage (type,
> severity, priority, suggested labels, suggested reply), pull-request
> summarization (risk signals, breaking-change detection, a one-line
> changelog entry), changelog drafting grouped by Added / Changed /
> Fixed, and documentation drafting for README, CONTRIBUTING, SECURITY,
> CODE_OF_CONDUCT, and templates. Each generated artifact is rendered
> with a confidence indicator and a list of missing context, so the
> maintainer always knows what the model did and did not see.
>
> Safety is enforced in the architecture, not in copy. All AI calls run
> server-side through a managed gateway; no provider keys are ever
> exposed to the browser. All user-data tables are protected by
> row-level security through a `has_repo_access` security-definer
> function, so a user can only ever read or write rows for repositories
> they are explicitly a member of. GitHub tokens are stored in a
> service-role-protected table and never returned to the client.
> Duplicate-post protection checks prior publish events before allowing
> a re-post, and every AI action and publish attempt is written to an
> audit log with model, target, status, and any sanitised error.
>
> MaintainerOS is currently a v0.1.0 public preview. It is functionally
> complete across the maintainer workflow described above, but it has
> not been deployed at scale, has no paying users, and claims no
> existing adoption. The repository is honest about this throughout —
> the README, the roadmap, and the in-product Trust Center all describe
> the project as a preview, and the UI uses cautious labels
> (`Live data`, `Partial data`, `Demo data`, `AI draft`) wherever data
> confidence matters. Demo mode lets evaluators try the entire product
> without connecting a real repository or risking a real write.
>
> The goal of joining an open-source ecosystem program at this stage is
> to get serious external review of the safety model — the approval
> gates, the audit log, the RLS policies, and the draft-only writes —
> before the project is recommended to maintainers of larger projects.
> Funding or credit support would go directly toward the work in the
> v0.2.0 roadmap: a real automated test suite, a hosted demo, an
> accessibility pass, and a self-hosting guide. The project is MIT
> licensed and will remain so.
