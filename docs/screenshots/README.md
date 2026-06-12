# Screenshots

No screenshots are committed yet. Capture them from the public preview in
clearly labeled demo mode before the v0.1.0 release leaves draft status.
**Do not invent, mock, or generate screenshots.**

Recommended captures (PNG, 1600×1000 or similar):

| File                 | What it should show                                                            |
| -------------------- | ------------------------------------------------------------------------------ |
| `landing.png`        | Public landing page (`/`) — hero + "How it works".                             |
| `dashboard.png`      | Demo dashboard with the persistent demo banner visible.                        |
| `repo-health.png`    | `/app/health` or `/app/readiness` with advisory language visible.               |
| `approval-queue.png` | `/app/approval-queue` with a sample draft awaiting human approval.              |
| `issue-triage.png`   | `/app/issues` with the AI triage side panel open on a sample issue.            |
| `pr-summary.png`     | `/app/pulls` with an AI PR summary draft visible.                              |
| `changelog.png`      | `/app/changelog` showing a generated draft grouped by Added / Changed / Fixed. |
| `docs-generator.png` | `/app/docs` with a generated README draft and confidence/safety notes visible. |
| `trust-center.png`   | `/app/trust` showing the safety and approval policy cards.                     |
| `readiness.png`      | `/app/readiness` showing the open-source readiness checklist.                  |
| `audit-log.png`      | `/app/actions` filtered to GitHub publish events.                              |
| `setup.png`          | `/setup` showing boolean diagnostics only, with no values or secrets.           |

Guidelines:

- Enter through `/demo` and use demo mode for every `/app/*` capture.
- Keep the demo banner visible — do not crop it out.
- Do not show real user emails, tokens, keys, cookies, private repository
  names, or other private data.
- Keep `Demo data`, `Demo AI output`, and advisory labels visible wherever
  they apply.
- Avoid inventing impressive-looking metrics; if a screen is mostly empty in
  a clean install, capture the empty state honestly.
