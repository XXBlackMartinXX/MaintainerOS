# Release Checklist

Run through this before tagging a release of MaintainerOS itself.

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
- [ ] CHANGELOG entry added (if maintained)

## Repository hygiene

- [ ] LICENSE present and current year
- [ ] CODE_OF_CONDUCT.md present
- [ ] SECURITY.md present and contact route is valid
- [ ] Issue templates open cleanly in GitHub
- [ ] PR template renders correctly
- [ ] `.github/FUNDING.yml` placeholders replaced (or removed)

## Publish

- [ ] Tag created
- [ ] Release notes drafted (using MaintainerOS itself 😄)
- [ ] Release marked as **draft** on GitHub for final review before publish
