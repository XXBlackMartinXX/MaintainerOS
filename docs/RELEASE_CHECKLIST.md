# Release Checklist

Run through this before tagging a release of MaintainerOS itself.

## v0.1.0 final smoke checklist

- [ ] Set the real public repo URL in `src/lib/project-meta.ts`
      (`repoUrl`, `docsUrl`, `licenseUrl`, `securityUrl`,
      `codeOfConductUrl`, `contributingUrl`, `changelogUrl`,
      `releaseNotesUrl`, `demoUrl`)
- [ ] Replace screenshot TODOs under `docs/screenshots/` and in `README.md`
- [ ] Configure GitHub OAuth App and add it as a Supabase Auth provider
- [ ] Verify Supabase project is healthy (migrations applied, RLS on)
- [ ] Verify Lovable AI Gateway key is present (`LOVABLE_API_KEY`)
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes (warnings reviewed)
- [ ] `bun run build` succeeds
- [ ] Demo mode walkthrough works end-to-end (landing → demo)
- [ ] Real repository sync completes against a test repo
- [ ] AI issue triage produces a draft on a real issue
- [ ] AI PR summary produces a draft on a real PR
- [ ] Changelog draft generated and editable
- [ ] Documentation draft generated and copyable
- [ ] GitHub write actions tested **in a sandbox/test repo only**
- [ ] Duplicate publish attempt is blocked
- [ ] AI Action Log shows every action with correct status
- [ ] No secrets committed (`.env`, screenshots, repo)
- [ ] No fake metrics, testimonials, or adoption claims
- [ ] Demo banner visible and not cropped in any screenshot
- [ ] `CHANGELOG.md` entry added for the version
- [ ] `docs/RELEASE_NOTES_v0.1.0.md` reviewed
- [ ] GitHub **draft** release created and reviewed before publishing

## Code health

- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes (warnings reviewed)
- [ ] `bun run build` succeeds
- [ ] Prettier formatted: `bun run format`

## Functional smoke tests

- [ ] Landing page loads and "Try demo" enters demo mode
- [ ] Demo banner visible, publish/sync controls disabled in demo
- [ ] Sign in with GitHub works against the live Supabase project
- [ ] Repository selector lists user's repositories
- [ ] Manual sync completes; issue / PR counts > 0
- [ ] AI issue triage produces a draft on a real issue
- [ ] AI PR summary produces a draft on a real PR
- [ ] Changelog draft generated and editable
- [ ] Documentation draft generated and copyable
- [ ] Publishing an issue reply works in a test repo
- [ ] Publishing labels works in a test repo
- [ ] Posting a PR comment works in a test repo
- [ ] Creating a release **draft** works in a test repo
- [ ] Duplicate publish attempt is blocked
- [ ] AI Action Log shows every action with correct status

## Safety

- [ ] No `console.log` of tokens, secrets, or full GitHub responses
- [ ] No fake metrics, testimonials, or adoption claims in UI or docs
- [ ] No real secrets committed (`.env`, screenshots)
- [ ] All AI outputs labeled "AI draft" (or "Demo AI output" in demo mode)
- [ ] Release drafts hardcoded to `draft: true`

## Documentation

- [ ] README screenshots updated (or placeholders called out)
- [ ] `docs/ROADMAP.md` reflects what shipped
- [ ] `docs/ARCHITECTURE.md` reflects current module layout
- [ ] `CHANGELOG.md` entry added
- [ ] `docs/MAINTAINER_HANDOFF.md` reviewed

## Repository hygiene

- [ ] LICENSE present and current year
- [ ] CODE_OF_CONDUCT.md present
- [ ] SECURITY.md present and contact route is valid
- [ ] CONTRIBUTING.md present
- [ ] `.env.example` complete
- [ ] Issue templates open cleanly in GitHub
- [ ] PR template renders correctly
- [ ] `.github/FUNDING.yml` placeholders replaced (or removed)
- [ ] `docs/` folder linked from README

## Publish

- [ ] Tag created (e.g. `v0.1.0`)
- [ ] Release notes drafted from `docs/RELEASE_NOTES_v<version>.md`
- [ ] Release marked as **draft** on GitHub for final review before publish
