# Release Operations

How to cut a release of MaintainerOS safely. Complements
[`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) (the line-by-line
smoke checklist) and [`REPOSITORY_OPERATIONS.md`](./REPOSITORY_OPERATIONS.md)
(repo-level settings).

> Releases of MaintainerOS itself stay **draft** until every gate below
> is green. We never tag, never publish, and never push to `main`
> without CI passing.

## 1. Tag and version conventions

- Versions follow [Semantic Versioning](https://semver.org/).
- Tag format is `vMAJOR.MINOR.PATCH` (e.g. `v0.1.0`).
- Pre-1.0 releases are marked **Pre-release** on GitHub and described
  as **public preview** in their notes.
- Patch releases (`v0.1.x`) are reserved for bug fixes and security
  fixes only — no feature additions.
- The `main` branch is always the source of truth for tags. Never tag
  from a feature branch.

## 2. Release notes source

Release notes are curated, never auto-generated from commit messages.

- Source file: `docs/RELEASE_NOTES_v<version>.md` (e.g.
  `docs/RELEASE_NOTES_v0.1.0.md`).
- `CHANGELOG.md` is updated in the same PR that bumps the version.
- Notes must include:
  - A one-paragraph honest summary (no marketing superlatives).
  - A **"Known limitations"** section that names what does **not** work yet.
  - A **"Safety model"** section linking to `docs/SECURITY_MODEL.md`,
    `docs/AI_SAFETY.md`, and `docs/GITHUB_INTEGRATION.md`.
  - No metrics, testimonials, stars, downloads, or adoption claims.
  - No "production-ready", "vulnerability-free", or
    "Anthropic-approved" language. The `check:claims` scan enforces
    this.

## 3. Pre-release gates (all must pass)

Run locally before drafting the release:

```bash
bun run typecheck
bun run test
bun run check:rls
bun run check:claims
bun run check:repo
bun run build
```

Plus the owner-run gates:

- [ ] `bun run sandbox:preflight` — local config classifier reports no
      missing required keys for whichever mode you are releasing.
- [ ] `bun run test:rls:runtime` — runtime RLS harness passes against a
      local Postgres (owner-run; see `docs/RLS_TEST_PLAN.md`).
- [ ] Sandbox verification (`docs/SANDBOX_VERIFICATION.md`) completed
      against a non-sensitive test repository.
- [ ] Screenshots refreshed per `docs/screenshots/README.md`.
- [ ] CI green on the commit being tagged.
- [ ] No open Dependabot **high/critical** alerts.
- [ ] No open CodeQL high/critical alerts.
- [ ] Branch protection on `main` is enabled
      (`docs/REPOSITORY_OPERATIONS.md` §2).

## 4. Drafting the release on GitHub

UI: **Releases → Draft a new release**.

| Field         | Value                                  |
| ------------- | -------------------------------------- |
| Tag           | `vX.Y.Z` (create on publish, target `main`) |
| Title         | `vX.Y.Z — Initial public preview` (or appropriate phrase) |
| Target        | `main`                                 |
| Pre-release   | **checked** (pre-1.0)                  |
| Draft         | **checked** until final review         |
| Generate notes| **do not** auto-generate the body; paste from `docs/RELEASE_NOTES_vX.Y.Z.md` |
| Discussion    | optional; off by default               |
| Assets        | none in this phase                     |

Final review checklist before clicking **Publish release**:

- [ ] Body matches `docs/RELEASE_NOTES_vX.Y.Z.md` verbatim.
- [ ] No screenshot leaks tokens, emails, or private repo names.
- [ ] All links in the body resolve.
- [ ] **Pre-release** is checked.

## 5. Rollback and patch releases

If a defect is discovered after publish:

1. **Do not** delete or force-overwrite an existing tag. Tag protection
   in `docs/REPOSITORY_OPERATIONS.md` blocks this anyway.
2. Open a fix PR targeting `main`.
3. Verify the fix is reachable without secrets and does not weaken
   RLS or approval-gated publishing.
4. Bump the patch version and create a new release
   (`vX.Y.(Z+1)`) with notes that name the issue, link the PR, and
   describe user-visible impact.
5. If the defect involves credentials, follow
   `docs/PRODUCTION_AUTH_SETUP.md` rotation guidance and document the
   incident.

## 6. What a release **must not** claim

The following phrases are blocked by `bun run check:claims` and must
never appear in release notes, README, blog posts, or product UI:

- "Production-ready" / "production-grade"
- "Vulnerability-free" / "100% secure"
- "SOC 2", "ISO 27001", "penetration tested" (unless externally verified
  with a linked report)
- "Anthropic approved", "Anthropic partnership", "officially endorsed"
- Adoption metrics that have not been measured (stars, downloads,
  active users, testimonials)
- "Autonomous publishing" or "fully automated"

Use instead:

- "Public preview" — today
- "AI-assisted, human-approved" — for any AI feature
- "Drafts only" — for releases created by the publish flow

## 7. Cross-references

- `docs/RELEASE_CHECKLIST.md` — line-by-line smoke list
- `docs/OWNER_LAUNCH_CHECKLIST.md` — owner-only external tasks
- `docs/REPOSITORY_OPERATIONS.md` — repo-level settings
- `docs/SANDBOX_VERIFICATION.md` — live-service verification
- `docs/EXTERNAL_REVIEW.md` — external security review package
