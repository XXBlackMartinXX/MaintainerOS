# Security Model

MaintainerOS is designed so that no third party — including the app itself — can take action on your GitHub repository without your explicit, recorded approval.

## Trust boundaries

| Surface | Trust | Notes |
| --- | --- | --- |
| Browser client | Untrusted | Holds only the publishable Supabase key and the user's session token. |
| TanStack server functions | Trusted | Run server-side. May use the user's OAuth token (via `requireSupabaseAuth`) or the service role key (admin operations only). |
| Supabase Postgres | Trusted, RLS-enforced | Every user-data table has row-level security. The service role key never reaches the browser. |
| Lovable AI Gateway | Trusted, server-side only | `LOVABLE_API_KEY` is read inside `.handler()` and never exposed to the client. |
| GitHub | External | Reads use the user's OAuth scopes. Writes require an additional approval flow (see below). |

## Authentication

- GitHub OAuth via Supabase Auth.
- Sessions are stored in `localStorage` by the generated Supabase client.
- Server functions that need the current user use the `requireSupabaseAuth` middleware so RLS still applies.

## Row-level security

Every per-repository table is gated by `has_repo_access(auth.uid(), repository_id)`. Users can only see data for repositories they are a member of in MaintainerOS.

## GitHub write actions

Writing to GitHub requires all of the following:

1. An AI draft in `approved` or `edited` state.
2. A user click on a publish button.
3. A confirmation dialog showing the exact payload that will be sent.
4. A duplicate-protection check against `github_publish_events`.
5. A row written to the audit log with target id, source draft id, and outcome.

Releases are always created with `draft: true`. Labels are only ever applied, never removed automatically.

## Secrets

| Variable | Where | Notes |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Used by `supabaseAdmin`. Never exposed. |
| `LOVABLE_API_KEY` | Server only | Read inside `.handler()` of AI server functions. |
| `GITHUB_CLIENT_SECRET` | Supabase Auth config | Stored in Supabase, never in the app. |

## Known limitations

- Heuristic security signals are not a substitute for a real audit.
- No SOC 2 / ISO certification.
- No data residency guarantees beyond Supabase defaults.
