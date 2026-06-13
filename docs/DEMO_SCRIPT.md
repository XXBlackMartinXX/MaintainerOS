# Demo Script

A reproducible 5–7 minute walkthrough of MaintainerOS using **demo mode only**.
This script is the source of truth for capturing screenshots, recording
short videos, and giving live walkthroughs of the public preview.

> Demo mode uses sample data. It never calls GitHub, the AI gateway, or
> any external service. The yellow "Demo mode active" banner must remain
> visible throughout.

## Pre-flight

- Use a clean browser profile (or incognito) at viewport 1440 × 900 or larger.
- Clear `localStorage` for the deployment so demo state is fresh.
- Verify the demo banner appears as soon as you enter `/app`. If it does
  not, the walkthrough must stop — that is a regression.

## Script

1. **Landing** — open `/`.
   - Talking point: "Public preview. Honest framing. No production-readiness
     claim and no fake metrics."
   - Click **Try the demo**.

2. **Demo dashboard** — `/app`.
   - Banner: "Demo mode active. All repositories, issues, PRs and AI outputs
     shown are illustrative sample data. Publishing and GitHub sync are
     disabled."
   - Talking point: "Every screen from here on is sample data."

3. **Issues + AI triage draft** — `/app/issues`.
   - Open an issue, surface the side panel.
   - Talking point: "AI output is always a draft. The maintainer edits it
     before any GitHub write."

4. **Pull requests + AI summary draft** — `/app/pulls`.
   - Show risk and breaking-change signals on a sample PR.

5. **Changelog draft** — `/app/changelog`.
   - Show Added / Changed / Fixed grouping. Note the "Demo AI output"
     label.

6. **Documentation draft** — `/app/docs`.
   - Pick a doc type (e.g. CONTRIBUTING). Note the confidence and
     missing-context fields.

7. **Approval Queue** — `/app/approval-queue`.
   - Talking point: "Nothing here can be posted to GitHub without an
     explicit click and a confirmation dialog. The AI cannot publish."

8. **Trust Center** — `/app/trust`.
   - Walk through "What requires explicit approval" and "What is never
     automatic".

9. **Readiness** — `/app/readiness`.
   - Talking point: "Advisory checklist. Heuristic only. Not a substitute
     for a manual review."

10. **Security** — `/app/security`.
    - Talking point: "Advisory signals only. Not a substitute for a
      security review."

11. **Setup diagnostics** — `/setup`.
    - Show that the page reports booleans only — no secret values are
      printed anywhere.

12. **Exit demo** — click "Exit demo" in the banner.
    - Show that `/app` then routes to `/login`, and that `/login`
      surfaces "Backend setup required" if the deployment is unconfigured.

## What must remain visible

- "Demo mode active" banner on every `/app/*` page.
- "Demo AI output" badge on every AI artifact.
- "Advisory signal" / "Heuristic only" wording on Trust, Readiness,
  Security, Health.
- "Setup required" callout on `/login` when unconfigured.

## What must never appear

- Real user emails, GitHub tokens, Supabase keys, or webhook secrets.
- Real customer logos, testimonials, star counts, or download counts.
- A "production-ready" or "SOC 2" badge anywhere.
- Any UI claim that AI can publish autonomously.

## Required screenshot set

The final public-demo capture set is documented in
`docs/screenshots/README.md`. It includes the landing page, demo dashboard,
repo health, audit log, and setup diagnostics. Approval-queue and AI-draft
captures were omitted because those verified routes did not contain
screenshot-ready sample items; no states were invented. Keep the demo banner
and demo/advisory labels visible, and do not use real private data.
