# Threat Model

This document is the **public-preview** threat model for MaintainerOS. It is
not a substitute for a formal security audit and does not claim
SOC 2, ISO, penetration testing, or production-readiness certification. It
exists so that future maintainers and reviewers can reason about what
MaintainerOS protects, against whom, and what is intentionally out of scope.

## System overview

MaintainerOS is a maintainer assistant for GitHub repositories. The browser
client reads aggregated repo data from Postgres (via Supabase) and renders
AI-generated *drafts* for issue triage, PR summaries, changelogs, and
documentation. Maintainers approve or edit drafts before any GitHub write
happens.

## Trust boundaries

| Surface                  | Trust                          | Notes                                                                                                                          |
| ------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Browser client           | Untrusted                      | Holds only the publishable Supabase key and the user's session token.                                                          |
| TanStack server fns      | Trusted, server-only           | Read secrets inside `.handler()`. May act as the signed-in user (`requireSupabaseAuth`) or as service-role (`supabaseAdmin`).  |
| Supabase Postgres        | Trusted, RLS-enforced          | Every user-data table has RLS. The service-role key never reaches the browser.                                                 |
| Managed AI gateway       | Trusted, server-only           | `LOVABLE_API_KEY` is read inside handlers and never bundled into client code.                                                  |
| GitHub                   | External, partially trusted    | Reads use the user's OAuth scopes. Writes require an explicit approval flow.                                                   |

## Assets protected

1. End-user GitHub OAuth access tokens (table `user_github_tokens`).
2. `SUPABASE_SERVICE_ROLE_KEY` and `LOVABLE_API_KEY` (server-only secrets).
3. Repository data and AI drafts scoped to the signed-in maintainer.
4. The integrity of GitHub write actions performed on behalf of the user.
5. The audit log (`audit_logs`, `github_publish_events`).

## Actors

- **Maintainer (authenticated).** Signs in with GitHub via Supabase Auth.
- **Anonymous visitor.** Can view marketing routes and demo mode only.
- **Demo-mode visitor.** Sees fixture data, cannot publish, cannot reach any
  authenticated server function.
- **AI gateway.** Returns drafts only; cannot act on GitHub.
- **GitHub.** External API; receives writes only after user confirmation.

## Data flows

```text
browser ──(publishable key + bearer)──> server fn (requireSupabaseAuth)
                                          │
                                          ├─► Supabase Postgres (RLS as user)
                                          ├─► supabaseAdmin (service-role, server-only)
                                          ├─► GitHub API (per-user OAuth token, server-only)
                                          └─► AI gateway (LOVABLE_API_KEY, server-only)
```

## Threats considered and current mitigations

| # | Threat | Mitigation |
|---|--------|------------|
| T1 | Service-role key leaked to client bundle | `client.server.ts` is server-only; loaded inside handlers via `await import()`. Verified by import graph + ESLint `server-only` rule. |
| T2 | AI gateway key leaked | `LOVABLE_API_KEY` read inside `.handler()` only. Never bundled. `requireFeature("ai-gateway")` error messages do not include the value (unit-tested). |
| T3 | Cross-user data exposure via Postgres | RLS enabled on every user-data table. Repo-scoped tables go through `has_repo_access(auth.uid(), repo_id)` SECURITY DEFINER fn. `user_github_tokens` has no `authenticated` policy — service-role only. |
| T4 | Privilege escalation through `auth-middleware` | Middleware rejects requests without a `Bearer` token; per-user client never gets service-role access. |
| T5 | Unintended GitHub writes | Every publish server fn requires: (a) draft in `approved`/`edited` state, (b) explicit `confirm: true` literal in the input, (c) repo membership check, (d) duplicate-protection lookup in `github_publish_events`, (e) audit-log row. |
| T6 | Final release published by mistake | `createRelease` hard-codes `draft: true`. There is no code path that creates a non-draft release. |
| T7 | Demo mode accidentally writes data | Demo mode reads from `localStorage` and renders fixture data; publish UI is disabled with explanatory tooltip. No authenticated server fn is reached. |
| T8 | Secret values surfaced in setup diagnostics | `getServerConfigStatus` returns booleans and the public project ref derived from the URL only — never secret values. |
| T9 | Stack traces leak internals | Production builds use generic error boundaries. Server fns surface short messages; raw provider responses are not echoed. |
| T10 | OAuth scope drift | `evaluateWritePermissions` re-checks scopes at call time. UI shows a "reconnect GitHub" CTA when write scopes are missing. |
| T11 | Replay / duplicate publish | `github_publish_events` is consulted before each publish; the UI shows "Already posted" and requires explicit re-confirmation. |
| T12 | Repository takeover via stale membership | `repository_memberships` is the single source of truth. Sync jobs update it; tokens alone do not grant access. |

## Manual owner responsibilities

These cannot be enforced from inside the app and must be done by the
repository owner:

- Enable GitHub private vulnerability reporting on the repository.
- Rotate `LOVABLE_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` if you suspect
  exposure.
- Review the GitHub OAuth scopes you grant during sign-in.
- Audit `audit_logs` and `github_publish_events` periodically.
- Keep dependencies current (`bun update`, security advisories).

## Known limitations

- No formal third-party security audit.
- No SOC 2 / ISO certification.
- No automated RLS test suite (covered manually + via Supabase linter).
- No end-to-end OAuth or GitHub-write integration tests.
- AI safety relies on schema validation and the approval gate — it does not
  guarantee correctness of any generated text.
- Heuristic signals on the Security / Trust / Readiness pages are
  **advisory** and not a substitute for manual review.

## Out of scope

- Multi-tenant org isolation beyond `repository_memberships`.
- Hardware-based key custody.
- Defending against a compromised maintainer account or device.
- Data residency guarantees beyond Supabase defaults.
