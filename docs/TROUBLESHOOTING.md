# Troubleshooting

## Auth

| Symptom | Cause | Fix |
| --- | --- | --- |
| Redirect loop on `/login` | Supabase session not hydrated before route loader runs | The `_app` layout gates on `supabase.auth.getSession()` in `beforeLoad`. Confirm the backend (Supabase) is connected. |
| `Unsupported provider: provider is not enabled` | GitHub OAuth provider not enabled in Supabase Auth | Connectors → Supabase Auth → Providers → enable GitHub and paste Client ID/Secret. |
| Every server fn returns 401 | `attachSupabaseAuth` not registered | Check `src/start.ts` includes `attachSupabaseAuth` in `functionMiddleware`. |

## GitHub

| Symptom | Cause | Fix |
| --- | --- | --- |
| `403` on publish | Missing `repo` scope | Reconnect GitHub from Settings → GitHub permissions. |
| `404` on publish | Wrong repo or issue/PR number | Re-sync the repository and retry. |
| `rate limit exceeded` | GitHub API rate limit | Wait until the next reset window (shown in the API response headers). |
| `Reference already exists` on release | The tag already exists in the repo | Pick a new version in the changelog draft. |

## AI

| Symptom | Cause | Fix |
| --- | --- | --- |
| "AI Gateway not configured" | `LOVABLE_API_KEY` missing | Backend Secrets → add `LOVABLE_API_KEY`. |
| "AI output rejected" | Model returned malformed JSON | Click "Generate again". |
| Repeated timeouts | Model overload or network blip | The wrapper retries once with backoff. If it still fails, try again later. |

## Sync

| Symptom | Cause | Fix |
| --- | --- | --- |
| Empty issues/PRs after sync | RLS hides rows because membership is missing | Re-run the connection from Onboarding. |
| Sync runs but counts stay zero | Repository has none of those items | Verify directly on GitHub. |

## Database

| Symptom | Cause | Fix |
| --- | --- | --- |
| `new row violates row-level security policy` | Missing `user_id` on insert | Ensure the insert sets `user_id = auth.uid()`. |
| `permission denied for table X` | RLS denied access | Confirm the user is a member of the repository in `repository_memberships`. |

## Build / runtime

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Cannot find module @/integrations/supabase/client` | File missing | Reconnect the backend (Supabase) — these files are generated. |
| `[unenv] X is not implemented yet!` | Node-only API used in server code | Replace with a Worker-compatible alternative. |
| `React is not defined` | Missing `import * as React` for `React.forwardRef` etc. | Add the import. |
