# Final Owner Actions

Strictly ordered list of the external tasks only the repository owner
can perform. Nothing here is automatable from inside the codebase; the
codebase is, as far as it can be, done.

Use this document together with:

- `docs/FINAL_READINESS_REPORT.md` — current status snapshot
- `docs/REPOSITORY_OPERATIONS.md` — exact GitHub UI paths
- `docs/RELEASE_OPERATIONS.md` — draft release flow
- `docs/SANDBOX_VERIFICATION.md` — live-service verification
- `docs/EXTERNAL_REVIEW.md` — review-request package
- `docs/CLAUDE_FOR_OSS_SUBMISSION_DRAFT.md` — application draft

---

## A. Must complete before the v0.1.0 draft release

These gates protect the public preview and the future production claim.

1. [ ] Confirm `main` is green in GitHub Actions on the commit you
       intend to tag (`ci`, `codeql`, `dependency-review` workflows).
2. [ ] Verify the public repository surface looks correct:
       README, LICENSE, SECURITY.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md,
       CHANGELOG.md, issue templates, PR template, `.github/FUNDING.yml`
       (placeholders still commented out unless real destinations exist).
3. [ ] In GitHub UI → **Settings → Code security**, enable:
       - [ ] Private vulnerability reporting
       - [ ] Secret scanning
       - [ ] Secret scanning push protection
       - [ ] Dependabot alerts
       - [ ] Dependabot security updates
       - [ ] CodeQL / code scanning (confirm the workflow is listed)
4. [ ] In GitHub UI → **Settings → Branches**, configure branch
       protection on `main` per `docs/REPOSITORY_OPERATIONS.md` §2:
       require PR + 1 approval, require CI + CodeQL + dependency review
       status checks, block force pushes and deletions, restrict
       bypassing.
5. [ ] In GitHub UI → **Settings → Tags**, protect `v*` from deletion
       and force-update.
6. [ ] In GitHub UI → **Settings → Actions → General**, set workflow
       permissions to read-only (workflows raise their own permissions
       explicitly) and disable "Allow GitHub Actions to create and
       approve pull requests".
7. [ ] Fill the GitHub About panel: description, website (once the
       demo URL is set in `src/lib/project-meta.ts`), and topics.
8. [ ] Run `bun run sandbox:preflight` locally and confirm no missing
       required keys for your target mode.
9. [ ] Run `bun run test:rls:runtime` against a local Postgres per
       `docs/RLS_TEST_PLAN.md`. Confirm it passes. Do not run against a
       managed or production host.
10. [ ] Walk through `docs/SANDBOX_VERIFICATION.md` end-to-end against
       a non-sensitive test repository. Record the audit log rows that
       result.
11. [ ] Capture the screenshots listed in `docs/screenshots/README.md`
       and `docs/DEMO_SCRIPT.md`. Confirm: demo banner visible in every
       `/app/*` screenshot; no tokens, emails, or private repo names
       visible.
12. [ ] Replace `TODO_PUBLIC_DEMO_URL` in `src/lib/project-meta.ts`
       once the public preview is live, and replace
       `TODO_SECURITY_CONTACT_EMAIL` in `SECURITY.md` (or rely on
       private vulnerability reporting once enabled).
13. [ ] Re-read `docs/RELEASE_NOTES_v0.1.0.md`. Confirm it still matches
       reality and contains the "Known limitations" section.
14. [ ] Create the GitHub release per `docs/RELEASE_OPERATIONS.md` §4:
       tag `v0.1.0` (created on publish), target `main`, **Pre-release
       checked**, **Draft checked**, body pasted verbatim from
       `docs/RELEASE_NOTES_v0.1.0.md`. **Leave it as a draft.**

## B. Must complete before any "production" claim

Do not change `docs/PRODUCTION_READINESS.md` status until all of these
are true.

1. [ ] Live OAuth verification against the production Supabase
       project, with the GitHub provider configured and the redirect
       URLs allow-listed.
2. [ ] Live GitHub sync verification on a real (non-sensitive)
       repository: connect → sync → see issues/PRs populate → disconnect.
3. [ ] Live AI verification: generate one draft of each type, confirm
       no secret leaks into the prompt logs or audit rows.
4. [ ] Runtime RLS either runs in CI on a required job, or the owner
       has documented (with dated evidence) that the harness was run
       against the deployed schema before the release was cut.
5. [ ] Playwright (or equivalent) E2E smoke covering: landing → demo;
       login failure path; setup wizard; approval queue; report export.
6. [ ] External security review per `docs/EXTERNAL_REVIEW.md`,
       completed with findings triaged and resolved (or formally
       accepted with rationale).
7. [ ] Written owner sign-off in `docs/PRODUCTION_RELEASE_DECISION.md`
       (or the equivalent file at that time), referencing the
       artifacts above.

## C. Optional, before submitting to Claude-for-OSS

These are not required by the application form, but each one materially
improves credibility.

1. [ ] Screenshots from §A captured and embedded in `README.md`.
2. [ ] One recorded walkthrough (or detailed text walkthrough) of the
       sandbox verification, suitable as supporting evidence.
3. [ ] The v0.1.0 release left as a draft pre-release, so the
       application links to a real release page rather than an empty
       releases tab.
4. [ ] One **maintainer report export** generated from the sandbox and
       attached or linked, showing what the report contains.
5. [ ] Open a GitHub Discussion or pinned issue titled
       *"External security review requested"* using the wording in
       `docs/EXTERNAL_REVIEW.md`. This both signals the project's
       posture and provides a public artifact to link in the
       application.
6. [ ] Re-read `docs/CLAUDE_FOR_OSS_SUBMISSION_DRAFT.md` and adapt it
       into the Anthropic application form. Do not add metrics or
       endorsement language. Run `bun run check:claims` on any text you
       paste back into the repo.

## D. What to do if a check fails after release

- **CI breaks on `main`** → revert the offending PR. Do not push a
  fix-forward without a green CI run on the revert.
- **Dependabot opens a high/critical advisory** → see
  `docs/RELEASE_OPERATIONS.md` §5 for the patch-release flow.
- **CodeQL opens a high alert** → triage within 7 days; cut a
  `v0.1.(N+1)` patch if it affects a write surface or RLS path.
- **Security report received privately** → acknowledge per
  `SECURITY.md`; do not discuss publicly until a fix is shipped.
