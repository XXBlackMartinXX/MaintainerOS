# First release tracking issue

Copy the block below into a new GitHub issue titled
**`Track v0.1.0 public preview launch`** and check items off as you go.

---

## Pre-launch

- [ ] Fill the GitHub **About** section (description, topics, website)
      — see `docs/OPEN_SOURCE_PROGRAM_APPLICATION.md` for suggested copy
- [ ] Set a real security contact in `SECURITY.md`
      (replace `TODO_SECURITY_CONTACT_EMAIL`)
- [ ] Deploy the public demo and set `PROJECT_META.demoUrl`
      in `src/lib/project-meta.ts` (replace `TODO_PUBLIC_DEMO_URL`)
- [ ] Capture screenshots listed in `docs/screenshots/README.md`
      and reference them from the main `README.md`
- [ ] Verify `README.md` reads cleanly end-to-end
- [ ] Verify `.env` is not tracked and no secrets are committed
      (`git ls-files | grep -E '^\.env$'` should return nothing)
- [ ] Run `bun run lint`, `bun run typecheck`, `bun run build`

## Launch

- [ ] Create the GitHub release `v0.1.0` as a **draft**
      using `docs/RELEASE_NOTES_v0.1.0.md` as the body
- [ ] Final review of the draft release
- [ ] Publish the `v0.1.0` release
- [ ] Open the good-first-issues from
      `docs/GOOD_FIRST_ISSUES.md` (one issue per entry)

## Post-launch

- [ ] Submit the Claude Open Source Program application
      using `docs/OPEN_SOURCE_PROGRAM_APPLICATION.md`
- [ ] Share the preview in 1–2 maintainer-focused communities
      for feedback
- [ ] Triage any inbound issues within the first week

---

**Definition of done:** the repository looks credible to a first-time
visitor, the demo URL works, screenshots are real, and the v0.1.0
release is published.
