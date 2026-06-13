# Screenshots

Captured from the public preview at <https://maintainer-os.lovable.app> on
2026-06-13. Every `/app/*` capture was entered through `/demo` and uses only
clearly labeled demo/sample data.

| File | Route captured | Description |
|---|---|---|
| `landing.png` | `/` | Public-preview landing hero and demo entry point. |
| `dashboard-demo.png` | `/demo` → `/app` | Demo dashboard with banner, `acme/atlas`, and illustrative dashboard data. |
| `repo-health.png` | `/app/health` | Advisory repo-health view with demo banner, demo-data badge, and heuristic wording. |
| `audit-log.png` | `/app/actions` | Demo AI action log with illustrative `demo.*` events. |
| `setup-diagnostics.png` | `/setup` | Setup diagnostics showing configuration names/statuses and placeholders, never secret values. |

`approval-queue.png` was omitted because the verified demo route rendered an
honest empty queue rather than a sample draft awaiting review. `ai-draft.png`
was omitted because the verified issue-triage route rendered no synced sample
issues and no open demo AI draft panel. These states were not fabricated.

Future recaptures must use the public demo, keep the demo banner and advisory
labels visible where applicable, and avoid secrets, tokens, cookies/session
values, private data, private repository names, fabricated metrics,
testimonials, adoption claims, production-readiness claims, and endorsement
claims. Do not invent, mock, or generate product screenshots.
