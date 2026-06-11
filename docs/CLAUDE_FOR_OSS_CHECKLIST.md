# Claude for Open Source — Application checklist

A pre-submission checklist for the maintainer preparing the Claude for
Open Source application. Tick items as they are verified manually
against the live repository and deployment. This file is descriptive,
not normative — it does not gate any code path.

## Repository and identity

- [ ] Public repo URL verified and reachable
      (https://github.com/XXBlackMartinXX/MaintainerOS).
- [ ] Repository description and topics reflect the current product.
- [ ] LICENSE present (MIT).
- [ ] CODE_OF_CONDUCT.md present (or generated and committed).
- [ ] SECURITY.md present (or generated and committed).
- [ ] Default branch is clean and reflects the latest preview state.

## Documentation

- [ ] `README.md` current and accurate.
- [ ] `docs/CLAUDE_FOR_OSS_APPLICATION.md` reviewed for honesty.
- [ ] `docs/PROJECT_IMPACT.md` reviewed for honesty.
- [ ] `docs/ROADMAP.md` reflects shipped vs planned.
- [ ] `docs/AI_SAFETY.md` present.
- [ ] `docs/SECURITY_MODEL.md`, `docs/THREAT_MODEL.md`, and
      `docs/SECURITY_REVIEW_CHECKLIST.md` present.
- [ ] `docs/TESTING.md` present.
- [ ] `docs/MAINTAINER_HANDOFF.md` reviewed.

## CI and tests

- [ ] CI workflow green on the default branch.
- [ ] `bun run typecheck` passes locally.
- [ ] `bun run lint` passes locally (warnings acceptable, no errors).
- [ ] `bun run test` passes locally (all tests deterministic, no live
      network).
- [ ] `bun run build` passes locally.

## Safety posture

- [ ] AI outputs remain drafts; no autonomous publishing path exists.
- [ ] Every GitHub write goes through the confirmation dialog.
- [ ] Releases are created with `draft: true`.
- [ ] No secrets, tokens, or service-role keys appear in client code,
      logs, or repo history.
- [ ] `.env` is not committed.
- [ ] Demo mode is isolated from real GitHub / Supabase.

## Honesty audit (no fabricated claims)

- [ ] No invented GitHub stars, npm downloads, users, or sponsors.
- [ ] No invented production usage or paying customers.
- [ ] No claim of formal Anthropic partnership.
- [ ] No claim that Claude access has been approved.
- [ ] No claim of formal third-party security certification.
- [ ] No claim of production-readiness without a verifiable basis.

## Release artifacts

- [ ] `CHANGELOG.md` covers v0.1.0.
- [ ] `docs/RELEASE_NOTES_v0.1.0.md` present.
- [ ] v0.1.0 GitHub release prepared (draft or pre-release).
- [ ] Public screenshots captured or explicitly marked as pending in
      `docs/screenshots/README.md`.

## Manual owner tasks before submission

- [ ] Verify the public GitHub repo reflects the latest state.
- [ ] Enable GitHub private vulnerability reporting.
- [ ] Configure Supabase and GitHub OAuth providers for any hosted
      preview.
- [ ] Capture and commit screenshots.
- [ ] Verify the hosted demo (if any) loads and shows demo data
      correctly.
- [ ] Create / publish v0.1.0 pre-release if desired.
- [ ] Copy `docs/CLAUDE_FOR_OSS_APPLICATION.md` into the Anthropic
      application form, with any reviewer-specific tailoring.
- [ ] Submit the Claude for Open Source application manually.

## Application materials status

- [ ] Application materials ready: `docs/CLAUDE_FOR_OSS_APPLICATION.md`.
- [ ] Impact narrative ready: `docs/PROJECT_IMPACT.md`.
- [ ] Pre-submission checklist ready: this file.
