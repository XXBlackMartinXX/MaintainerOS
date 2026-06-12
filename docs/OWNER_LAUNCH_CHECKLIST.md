# Owner Launch Checklist

Single owner-facing list of manual tasks that **cannot be automated from
inside the app**. These require access to GitHub, Supabase, or the
deployed environment under the project owner's account.

Run through this list before the v0.1.0 public release and again before
inviting any external reviewer.

> Marking an item complete here does not change anything inside the
> repository. These items are exclusively external account / environment
> tasks.

## Public repository

- [ ] Confirm the public repository URL matches
      `src/lib/project-meta.ts` (`repoUrl`).
- [ ] Verify GitHub Actions CI is green on `main` and publicly visible.
- [ ] Enable **Private vulnerability reporting**
      (Settings → Code security → Private vulnerability reporting).
- [ ] Enable **Secret scanning** and **Push protection**.
- [ ] Enable **CodeQL / default code scanning**.
- [ ] Enable **Dependabot alerts** and **Dependabot security updates**.
- [ ] Add `Description`, `Website`, and `Topics` on the GitHub About panel
      (suggested topics: `github`, `maintainer-tools`, `open-source`,
      `ai-drafts`, `human-in-the-loop`, `tanstack-start`, `supabase`).

## Backend (Supabase) — only required for live mode

- [ ] Confirm the Supabase project is healthy and migrations are applied.
- [ ] Configure the GitHub OAuth provider in Supabase Auth → Providers.
- [ ] Add deployed Redirect URLs in Supabase Auth (origin and
      `/auth/callback`).
- [ ] Verify the managed AI gateway key (`LOVABLE_API_KEY`) is present
      server-side.
- [ ] Do **not** commit any `.env`. `.env.example` is the only env file
      that lives in the repo.

## Deployment

- [ ] Confirm the deployed `/demo` route works end-to-end with the demo
      banner visible.
- [ ] Confirm the deployed `/setup` route reports booleans only, never
      prints secret values.
- [ ] Confirm `/login` shows "Backend setup required" cleanly when env is
      missing (this is the safe fallback state).

## Verification against a non-sensitive test repository

These items require a **sandbox / test GitHub repository** owned by the
maintainer. Never run them against a sensitive or production repo.

- [ ] Sign in with GitHub against the deployed Supabase project.
- [ ] Connect the sandbox repository and run an on-demand sync.
- [ ] Generate one AI issue triage draft on an existing closed issue.
- [ ] Generate one AI PR summary draft on an existing closed PR.
- [ ] Generate one changelog draft.
- [ ] Generate one documentation draft.
- [ ] Run the **approval-gated publish** flow end-to-end:
      issue comment, label apply, PR comment, draft release.
- [ ] Verify the duplicate-publish check blocks a second attempt.
- [ ] Verify the audit log records every action with the correct status.

## Screenshots and demo evidence

- [ ] Capture screenshots following
      [`docs/screenshots/README.md`](./screenshots/README.md) and
      [`docs/DEMO_SCRIPT.md`](./DEMO_SCRIPT.md).
- [ ] Confirm the **demo banner is visible and not cropped** in every
      `/app/*` screenshot.
- [ ] Confirm no real emails, tokens, secrets, or private repo names are
      visible in any image.
- [ ] Save screenshots into `docs/screenshots/` and commit.

## v0.1.0 release

- [ ] Update `CHANGELOG.md` if anything changed since the last note.
- [ ] Review `docs/RELEASE_NOTES_v0.1.0.md` for accuracy.
- [ ] Create a GitHub release with these exact fields:

  | Field            | Value                              |
  | ---------------- | ---------------------------------- |
  | Tag              | `v0.1.0`                           |
  | Target branch    | `main`                             |
  | Title            | `v0.1.0 — Initial public preview`  |
  | Pre-release      | **checked**                        |
  | Draft            | **checked** (review before publishing) |
  | Release notes    | copy from `docs/RELEASE_NOTES_v0.1.0.md` |

- [ ] Leave the release as a **draft** until the screenshot capture pass
      and reviewer walkthrough have been completed.

## Optional: Claude-for-OSS submission

- [ ] Open [`docs/CLAUDE_FOR_OSS_APPLICATION.md`](./CLAUDE_FOR_OSS_APPLICATION.md).
- [ ] Verify the test count, repo URL, and limitations section match the
      current state of the repository before copying any text into the
      application form.
- [ ] Do not claim eligibility metrics you have not personally verified
      on GitHub or npm.

## Public-claims sanity check

- [ ] Run `bun run check:claims` locally and confirm it exits 0.
- [ ] Scan the repository README, release notes, and any blog/launch post
      for any of the phrases listed in `src/lib/product-copy.ts`
      `FORBIDDEN_COPY`. If found, fix before publishing.


## P6 — Integration boundaries & sandbox verification

See `docs/INTEGRATION_BOUNDARIES.md` for the per-integration boundary audit and `docs/SANDBOX_VERIFICATION.md` for the owner-run live-service checklist. Run `bun run sandbox:preflight` for a non-destructive local config classifier (never prints secret values).
