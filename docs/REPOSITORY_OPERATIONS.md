# Repository Operations

Owner-facing reference for the GitHub-native settings that protect this
repository. Some controls live in repo files (CI workflows, Dependabot,
PR template); others must be enabled by the repository owner from the
GitHub UI and **cannot be enforced from code alone**.

> Marking an item in this document does not change anything on GitHub.
> These steps must be performed by an account with admin rights on the
> repository.

## Legend

- **(repo)** — encoded in this repository
- **(UI)** — must be configured in the GitHub web UI
- **(optional)** — recommended but not required
- **(blocker)** — should be done before any "production" claim

---

## 1. Security features

| Setting | Where | Status |
| --- | --- | --- |
| Private vulnerability reporting | UI: Settings → Code security → Private vulnerability reporting → Enable | **(blocker)** |
| Secret scanning | UI: Settings → Code security → Secret scanning → Enable | **(blocker)** |
| Secret scanning **push protection** | UI: Settings → Code security → Push protection → Enable | **(blocker)** |
| Dependabot alerts | UI: Settings → Code security → Dependabot alerts → Enable | **(blocker)** |
| Dependabot security updates | UI: Settings → Code security → Dependabot security updates → Enable | **(blocker)** |
| Dependabot version updates | repo: `.github/dependabot.yml` | done |
| CodeQL / code scanning | repo: `.github/workflows/codeql.yml` + UI: Settings → Code security → Code scanning → confirm CodeQL is listed | done (repo) / verify (UI) |
| Dependency review on PRs | repo: `.github/workflows/dependency-review.yml` | done |

After enabling each (UI) item, confirm an alert tab appears under
**Security** for that feature.

## 2. Branch protection (main)

UI: **Settings → Branches → Add branch protection rule** for `main`.

Recommended ruleset:

- [ ] **Require a pull request before merging**
- [ ] **Require approvals**: at least 1
- [ ] **Dismiss stale pull request approvals when new commits are pushed**
- [ ] **Require status checks to pass before merging**
  - [ ] CI / build
  - [ ] CodeQL / Analyze (javascript-typescript) (after first run)
  - [ ] Dependency Review (PRs only)
- [ ] **Require branches to be up to date before merging**
- [ ] **Require conversation resolution before merging**
- [ ] **Require linear history** *(optional)*
- [ ] **Do not allow bypassing the above settings**
- [ ] **Restrict who can push to matching branches** — owners only
- [ ] **Block force pushes**
- [ ] **Block deletions**

Tag protection (UI: Settings → Tags → New rule):

- [ ] Protect tags matching `v*` from deletion / force-update.

## 3. Actions permissions

UI: **Settings → Actions → General**.

- [ ] **Actions permissions**: Allow `actions/*` and `github/codeql-action/*`
      and any pinned third-party actions used in workflows (currently
      none beyond the GitHub-published ones).
- [ ] **Workflow permissions**: **Read repository contents and packages
      permissions** (least privilege). Individual workflows raise their
      permissions explicitly when needed (e.g. CodeQL requests
      `security-events: write`).
- [ ] **Allow GitHub Actions to create and approve pull requests**:
      **Disabled** (we do not auto-merge).
- [ ] **Fork pull request workflows from outside collaborators**:
      Require approval for first-time contributors.

## 4. About / discoverability

UI: repository home → **About** (cog icon, top-right).

- [ ] **Description**: a one-sentence honest summary (see `README.md`).
- [ ] **Website**: the public preview URL once configured in
      `src/lib/project-meta.ts`.
- [ ] **Topics** (suggested):
      `github`, `maintainer-tools`, `open-source`, `ai-drafts`,
      `human-in-the-loop`, `tanstack-start`, `supabase`.
- [ ] **Releases**: visible.
- [ ] **Packages**: hidden (none published).

## 5. Releases

UI: **Settings → General → Features**.

- [ ] **Releases**: enabled.
- [ ] Use the GitHub **"Generate release notes"** button as a starting
      point, but always replace the body with the curated notes from
      `docs/RELEASE_NOTES_v0.1.0.md`. See
      [`RELEASE_OPERATIONS.md`](./RELEASE_OPERATIONS.md).

## 6. Issue and PR templates

Encoded in the repo and require no UI work:

- `.github/ISSUE_TEMPLATE/bug_report.yml`
- `.github/ISSUE_TEMPLATE/feature_request.yml`
- `.github/ISSUE_TEMPLATE/config.yml`
- `.github/pull_request_template.md`

## 7. Funding

`.github/FUNDING.yml` ships with placeholders **commented out**. Do not
uncomment until a real funding destination exists. Empty/placeholder
funding links degrade trust on the repository About panel.

## 8. What is NOT enforceable from code

These cannot be set from a workflow or a config file and must be done in
the GitHub UI by an admin:

- Private vulnerability reporting toggle
- Secret scanning / push protection toggles
- Dependabot alerts toggle (the *config* is in-repo; the *alerting* is a UI toggle)
- Branch protection rules
- Tag protection rules
- Actions permission scopes
- About panel description, website, topics
- Repository visibility (public/private)
- Member and team permissions

This list is the **owner manual checklist** referenced from
`docs/OWNER_LAUNCH_CHECKLIST.md`.

## 9. Required before any "production" claim

A "production-ready" claim is **not** appropriate until all rows below
are true:

- [ ] All **(blocker)** rows in Section 1 are enabled.
- [ ] Branch protection on `main` (Section 2) is enabled.
- [ ] Workflow permissions (Section 3) are restricted.
- [ ] CI is green on `main`.
- [ ] CodeQL has completed at least one successful scan with no
      open high/critical alerts.
- [ ] Owner sandbox verification in `docs/SANDBOX_VERIFICATION.md` has
      been completed.
- [ ] Runtime RLS harness (`bun run test:rls:runtime`) has been run
      against a local Postgres and passes.
- [ ] External review per `docs/EXTERNAL_REVIEW.md` has been requested
      and completed.

Until then, the project remains in **public preview** and the wording in
`docs/PRODUCTION_READINESS.md` applies.
