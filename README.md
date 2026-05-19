# MaintainerOS

> An honest, AI-assisted operations center for open-source maintainers.

MaintainerOS connects to your GitHub repositories and gives you one focused
dashboard for issues, pull requests, contributors, repo health, and AI drafts
for triage, summaries, and changelogs. Every AI output is a **draft** — nothing
is posted to GitHub without your explicit approval.

> **Status:** v0.3 — live GitHub OAuth, repository sync, and live data on
> the Issues, Pull Requests, Contributors, and Repo Health pages. Real AI
> triage is the next slice.

## Implemented today

- GitHub OAuth via Lovable Cloud (Supabase Auth)
- Repository connection + on-demand sync (issues, PRs, contributors, labels, commits)
- Live Issues page (search, filters, sort, stale detection)
- Live Pull Requests page (search, state/merged filters, sort, large-diff warnings)
- Live Contributors page (distribution chart, top contributors, privacy-respecting wording)
- Live Repo Health score with transparent breakdown and recommended actions
- Dashboard sync-status panel with last-sync time, counts, error surfacing, and a Sync now button
- Clear `Live GitHub data`, `Partial data`, and `Demo data` badges everywhere
- Polished shell for changelog, docs, security, moderation, roadmap, and AI action log (preview)

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
