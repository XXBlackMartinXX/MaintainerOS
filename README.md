# MaintainerOS

> An honest, AI-assisted operations center for open-source maintainers.

MaintainerOS connects to your GitHub repositories and gives you one focused
dashboard for issues, pull requests, contributors, repo health, and AI drafts
for triage, summaries, and changelogs. Every AI output is a **draft** — nothing
is posted to GitHub without your explicit approval.

> **Status:** pre-1.0. Functionally complete across the core maintainer
> workflow: live GitHub sync, AI issue triage, AI PR summaries, AI changelog
> drafts, AI documentation drafts, approval-gated GitHub publishing, audit
> log, demo mode, and a Trust Center. This project does not claim production
> adoption, downloads, stars, or paying users.

## Screenshots

Screenshot placeholders — replace before publishing publicly:

- `docs/screenshots/dashboard.png`
- `docs/screenshots/issue-triage.png`
- `docs/screenshots/pr-summaries.png`
- `docs/screenshots/audit-log.png`

## Implemented today

- GitHub OAuth via Lovable Cloud (Supabase Auth)
- Repository connection + on-demand sync (issues, PRs, contributors, labels, releases)
- Live Issues, Pull Requests, Contributors, and Repo Health pages
- AI issue triage (type, severity, priority, labels, suggested reply) — drafts only
- AI PR summaries with risk, breaking-change detection, changelog entry — drafts only
- AI changelog generator grouped by Added / Changed / Fixed — drafts only
- AI documentation generator (README, CONTRIBUTING, SECURITY, …) — drafts only
- Approval-gated GitHub write actions: issue replies, label apply, PR comments, draft releases
- Duplicate-post protection backed by `github_publish_events`
- AI Action Log with filter chips and publish-event enrichment
- Demo mode with global banner and disabled publish/sync controls
- First-run product tour (skippable, restartable from Settings)
- Trust Center and internal QA checklist pages
- Clear `Live GitHub data`, `Partial data`, `Demo data`, `AI draft` labels everywhere

## Ethics

MaintainerOS is built to be honest:

- Never fakes stars, contributors, downloads, commits, or activity
- Never auto-posts, auto-closes, or auto-enforces — every action requires approval
- Never infers sensitive personal traits about contributors
- Uses cautious language ("review recommended", "partial signal") when confidence is low
- Logs every AI action with model, target, and outcome

## Tech stack

- **TanStack Start** (React 19, SSR, server functions) on Vite 7
- **TypeScript** + **Tailwind CSS v4** + **shadcn/ui**
- **Lovable Cloud** (Supabase) for auth, Postgres, RLS
- **Lovable AI Gateway** for AI features (planned)
- Cloudflare Workers / Vercel-compatible deployment

## Local development

```bash
bun install
bun run dev
```

## GitHub OAuth setup

1. Create a GitHub OAuth App at <https://github.com/settings/developers>.
2. Set the **Authorization callback URL** to:
   ```
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```
3. In Lovable Cloud → **Auth → Providers → GitHub**, paste your Client ID and
   Client Secret and enable the provider.
4. Recommended scopes: `read:user user:email repo read:org`.

On first sign-in, MaintainerOS persists the GitHub access token in the
service-role-protected `user_github_tokens` table. Tokens are never returned
to the browser and never logged.

## Database & RLS

The schema is managed via Supabase migrations in `supabase/migrations/`.
Every table that holds repository data is gated by RLS through the
`has_repo_access(user_id, repository_id)` security-definer function. A user
sees repository rows only if they have a row in `repository_memberships`.

## Sync model

- The user picks repositories during `/onboarding`.
- The active repository is stored client-side (localStorage) and selectable
  from the top nav.
- The Dashboard surfaces sync state (`idle` · `running` · `success` · `error`)
  and counts. A **Sync now** button calls the `syncRepository` server function,
  which pulls issues, PRs, contributors, labels, and commits in parallel
  (paginated, capped to keep API usage modest) and upserts into Postgres.
- All page-level queries are scoped by RLS to the authenticated user.

## Live vs demo data

- Pages backed by synced data display a green `Live GitHub data` badge.
- Pages that still rely on illustrative numbers display a yellow `Demo data`
  badge so nothing is presented as a real metric.
- The Repo Health page shows `Partial data` for signals (security, releases)
  that are not yet wired to real sources.

## Environment variables

See `.env.example`. In Lovable Cloud most server-side values are managed for
you; only the GitHub OAuth credentials need to be configured in the Auth
provider screen.

## Deployment

The project is preconfigured for Cloudflare Workers (`wrangler.jsonc`). Any
Edge-compatible host that supports TanStack Start works — set the same
environment variables and run the project's build script.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). All contributors are expected to
follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Security

See [SECURITY.md](./SECURITY.md) for responsible disclosure.

## License

[MIT](./LICENSE)

## AI issue triage (Slice 4)

MaintainerOS uses the **Lovable AI Gateway** (server-side, via
`LOVABLE_API_KEY`) to generate **editable triage drafts** for live GitHub
issues. The browser never sees the AI key.

### Behavior
- Click **Analyze** on any issue (or **Analyze visible** for a batch) to
  generate a structured triage draft.
- The draft includes type, severity, priority, complexity, confidence,
  suggested labels, sentiment, duplicate likelihood, recommended next
  action, an editable suggested maintainer reply, and risk / safety notes.
- Every draft is labeled **AI draft** in the UI. The model is recorded.
- Drafts are **copy-only** in this slice. MaintainerOS **does not post to
  GitHub** automatically. You approve, edit, reject, or copy the reply
  yourself.

### Safety principles
The triage system prompt instructs the model to:
- assist maintainers, not make final moderation/security decisions
- never infer sensitive personal traits about contributors
- never recommend punitive action automatically
- use cautious "review recommended" language for security or abuse signals
- return valid structured JSON only, with `unknown` enum values when
  confidence is low

### Audit logging
Every AI action is written to `audit_logs` and surfaced on **AI Action
Log**: `ai.triage.generated`, `ai.triage.approve`, `ai.triage.edit`,
`ai.triage.reject`, `ai.triage.copy`, `ai.triage.failed`.

### Configuration
If `LOVABLE_API_KEY` is missing, the Analyze buttons are disabled and a
configuration warning is shown. No fake AI output is ever displayed.

## AI pull request summaries & changelog (Slice 5)

Pull requests can be summarized into editable AI drafts. Approved summaries
become the source of truth for AI-generated release notes. Nothing is posted
to GitHub by this app.

### PR summaries
- `Analyze` on any row generates a structured draft (change type, risk,
  breaking-change likelihood, suggested review focus, testing/security notes,
  release-note candidate, missing context, safety notes).
- `Analyze visible PRs` runs sequential bulk analysis on the current filtered
  list with confirmation and progress; already-analyzed PRs are skipped
  unless you explicitly re-analyze.
- Drafts can be approved, edited, rejected, or copied. Every action is logged
  in `audit_logs` (`ai.pr_summary.*`).

### Changelog generation
- `/app/changelog` calls the AI gateway with **only approved PR summaries**
  as source material. Approved-count badge shows whether output is `live`,
  `partial`, or `preview only`.
- AI returns a structured result (semver recommendation + rationale, grouped
  sections, breaking changes, migration notes, known limitations, Markdown).
- Markdown is fully editable. Save draft / approve / reject / copy are logged
  as `ai.release_draft.*`. Drafts are stored in the `release_drafts` table.

### Tables added
- `pull_request_ai_summaries` — one editable AI draft per (PR, user).
- `release_drafts` — generated changelogs (version, title, markdown, structured result).
- Both use RLS scoped to the owning user.

### Prompts and safety
- The PR prompt forbids claims that a PR is safe, correct, or mergeable
  without evidence, and forces the model to list `missingContext`.
- The changelog prompt forbids inventing changes that are not present in the
  approved summaries and forces uncertain items into `knownLimitations` or
  `missingContext`.
- Drafts are always labeled "AI draft". No auto-posting to GitHub.

## GitHub Write Actions (Slice 6)

MaintainerOS can publish approved AI-assisted drafts back to GitHub. Every
public write is **explicit, confirmed, approval-gated, duplicate-protected,
and audited**. Nothing is posted automatically.

### Required GitHub OAuth scopes
- `repo` — required to comment on issues, comment on pull requests, apply
  labels, and create draft releases on private repositories.
- `public_repo` — sufficient for the same actions on public repositories.

If write scopes are missing, the Settings page shows a "Reconnect GitHub"
prompt and all Post / Apply / Create buttons stay disabled.

### How approval-gated publishing works
1. AI generates a draft (issue reply, suggested labels, PR summary, or
   release notes).
2. A maintainer reviews, edits, and **approves** the draft.
3. Only `approved` or `edited` drafts surface a publish button.
4. The maintainer clicks the button and sees a confirmation dialog with a
   preview of the exact content that will be posted.
5. The maintainer confirms. The server function posts to GitHub.

### Supported publish actions
- **Issue comment publishing** — posts the approved AI reply as a GitHub
  issue comment.
- **Issue label application** — applies labels to the issue. Only labels
  that already exist in the repository are pre-selected; the maintainer can
  edit the final set before confirming.
- **PR summary posting** — posts the structured AI summary as a comment on
  the pull request via the issues comments endpoint.
- **Draft release creation** — creates a GitHub release with
  `draft: true`. MaintainerOS **never** publishes a non-draft release.

### Duplicate-post protection
Before every publish, the server checks `github_publish_events` for a
prior `success` event with the same `(source_type, source_id, target)`. If
one exists, the API returns `alreadyPosted: true` with the previous GitHub
URL. The UI then requires explicit re-confirmation; the re-post is audited
as `*.reposted` and shown as "duplicate confirmed" in the AI Action Log.

### Audit logging
Every publish attempt writes both:
- an `audit_logs` entry (`github.<resource>.<attempted|success|failed|reposted>`), and
- a row in `github_publish_events` with status, target, GitHub URL on
  success, and sanitised error message on failure.

Inspect everything from **AI Action Log** → filter "GitHub publish". Open a
row to see action, target, source, publish status, GitHub URL, sanitised
error, and raw metadata in the advanced section. Tokens and bearer
credentials are never written to either table.

### How to disable write actions
- **Per session**: sign out of GitHub or revoke the MaintainerOS OAuth app
  from your GitHub account settings.
- **Per workspace**: reconnect with a token that lacks `repo` /
  `public_repo`. The Settings page will show write actions as disabled.

### Safety policy
- No automatic posting of any kind.
- No automatic label application.
- No published releases — `draft: true` is hardcoded server-side.
- All public writes require an approved or edited AI draft, an explicit
  user click, a confirmation dialog, an audit log entry, and a
  duplicate-protection check.

### Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| "Your GitHub session is missing write scope" | OAuth token lacks `repo` / `public_repo`. Go to Settings → Reconnect GitHub. |
| "Repository access denied" (HTTP 403/404) | Your GitHub account is not a collaborator on the target repo, or org SSO is not authorised for the token. |
| "Already posted to GitHub" notice | Duplicate-post protection found a previous successful publish. Click "Post again" to confirm a re-post. |
| GitHub rate limit (HTTP 403 with `rate limit`) | Wait until the reset window. Authenticated requests get 5,000/hour per token. |
| "No approved draft to publish" | The draft is still `pending` or was `rejected`. Approve or edit it first. |
| "Release tag already exists" (HTTP 422) | GitHub rejected the release because the tag is in use. Change the version on the changelog draft before creating the release. |


## Documentation Generator (Slice 7)

The Documentation Generator drafts the files every healthy open-source project
needs, using live repository metadata, synced contributors/labels, and approved
PR summaries as input.

Supported doc types: README improvement suggestions, CONTRIBUTING.md,
SECURITY.md, CODE_OF_CONDUCT.md, GitHub issue template, GitHub pull request
template, maintainer guide, release process guide, new contributor onboarding.

### Workflow
1. Open **Documentation** and pick a doc type.
2. Click **Generate draft**. Lovable AI Gateway (server-side only) produces an
   editable Markdown draft, confidence score, missing-context list, safety
   notes, and a source-data summary.
3. Edit the title and body inline. Save → marks the draft as `edited`.
4. Approve or Reject. All actions are logged in the AI Action Log.
5. **Copy Markdown** and paste into your repo. MaintainerOS does **not** commit
   docs to GitHub in this slice — buttons labelled
   *"Create PR with this doc — coming soon"* and *"Commit file to GitHub — coming soon"*
   are placeholders for the future workflow.

If `LOVABLE_API_KEY` is missing, generation is disabled and the page shows
setup instructions.

## Security Readiness Dashboard

The **Security** page is a practical readiness review, not a vulnerability
scanner. Each signal uses cautious badges: *Looks ready*, *Review recommended*,
*Missing data*, *Not configured*. We never claim a project is "secure" or
"insecure" — those words require evidence MaintainerOS does not have.

Signals: SECURITY.md draft presence, dependency metadata availability, release
cadence, stale critical issues, open security-labeled issues, responsible
disclosure guidance, code-owner guidance, public write-action safety, AI
publishing safety, recent sync freshness.

### Limitations
- Repository file contents (SECURITY.md, CODEOWNERS, dependency manifests) are
  **not** read in this slice — those checks show *Missing data* until you
  generate a draft or wire up file inspection.
- No CVE database lookup. No supply-chain analysis.
- The optional AI security guidance is a copy-only draft. Nothing is published.

## Open-source Readiness Checklist

The **Readiness** page shows a completion percentage across the basics:
README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, issue template, PR template,
release process, repo sync, AI audit logging, GitHub-write gating, demo-data
labeling. Each item links to the next recommended action.

Items backed by live sync data are tagged **verified live**. Items satisfied by
an AI draft are tagged **draft available** — they still require manual editing
and committing.

## Future GitHub PR workflow

A future slice will add an opt-in PR workflow that opens a real pull request
against the repo with generated docs. Until then, the manual copy workflow
above is the only supported path.

