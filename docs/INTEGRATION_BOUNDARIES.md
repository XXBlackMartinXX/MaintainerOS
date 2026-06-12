# Integration Boundaries

This document audits the boundary between MaintainerOS and each external
live service. It describes what is exercised in CI (deterministic, no live
credentials) and what must be verified by the project owner in a sandbox
deployment.

> Scope: **boundary documentation**, not a security review. Treat every
> "remaining risk" entry as a real limitation until owner-run sandbox
> verification (see `docs/SANDBOX_VERIFICATION.md`) is completed.

## Summary table

| Integration       | Safe in CI                                         | Requires sandbox                                | Primary failure modes                            | Current mitigation                                              |
| ----------------- | -------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| Supabase (client) | env detection, missing-config UI, demo mode        | real auth, RLS-scoped reads/writes              | missing env, invalid key, RLS denial             | safe client + `/setup` diagnostics, RLS static checks           |
| Supabase (server) | typed admin client, env detection, classifier      | service-role writes, OAuth callback             | missing service role, schema drift              | server-only import path, RLS static checks (`check:rls`)        |
| GitHub OAuth      | redirect URL builders, scope hint copy             | actual sign-in, token issuance, scope grant     | provider not configured, redirect URL mismatch   | wizard hints; tokens stored server-only                         |
| GitHub REST API   | URL/headers builders, error classifier             | repo list, issue/PR/release sync                | 401/403, 404, 429 rate limit, network            | typed errors, retries bounded, no token echo                    |
| GitHub writes     | dry-run helpers, approval-gate unit tests          | live comment/label/release write                | duplicate publish, insufficient scope            | approval-gated server fns, duplicate-publish checks             |
| AI gateway        | config detection, JSON schema validation           | real model call, latency, content quality       | missing key, 402 credits, 429, schema mismatch  | typed errors, drafts only, never auto-publish                   |
| Setup diagnostics | booleans-only payload, redact tests                | n/a (already boolean)                           | accidental secret echo                           | server fn returns booleans only; covered by tests               |
| Audit log         | shape tests, redaction                             | live event capture                              | missing entry, secret leakage                    | inserts scoped server-side; no token fields in payload          |

## Supabase

- **Client env detection** — `src/integrations/supabase/safe-client.ts` and
  `src/lib/env.ts`. Browser uses publishable key only.
- **Server admin client** — `src/integrations/supabase/client.server.ts`,
  Proxy-wrapped, service-role; loaded inside server-fn handlers only.
- **Auth middleware** — `src/integrations/supabase/auth-middleware.ts`
  validates the bearer token; rejects requests without it.
- **OAuth callback** — `src/routes/auth.callback.tsx` (no token rendering).
- **RLS** — covered statically by `scripts/check-rls-policies.ts` and
  `src/lib/security/rls-policy-checks.test.ts`. Runtime RLS is not yet
  exercised (P8).
- **Safe in CI**: env detection, classifier, RLS static scan.
- **Requires sandbox**: real OAuth callback, RLS-scoped reads/writes,
  session lifecycle.

## GitHub

- **Scopes**: `read:user user:email repo read:org` (advisory).
- **Reads**: `src/lib/github/api.server.ts` (issues, PRs, releases, labels).
- **Token storage**: `user_github_tokens` table; RLS deny-by-default;
  service-role-only access; never returned to the client.
- **Writes**: `src/lib/github/write.server.ts` — approval-gated, duplicate
  publish checks, draft-release-only.
- **Safe in CI**: URL/header builders, error classifier, duplicate-publish
  logic (unit-tested), approval-queue invariants.
- **Requires sandbox**: real OAuth flow, real repo sync, comment/label
  write, draft release creation, rate-limit and permission failures.

## AI gateway

- **Provider**: `src/lib/ai/provider.server.ts` calls
  `https://ai.gateway.lovable.dev/v1/chat/completions` using
  `LOVABLE_API_KEY`.
- **Error classes**: `AIConfigError`, `AIRateLimitError`, `AICreditsError`,
  `AIResponseError`. No retry on config/credits/rate-limit.
- **Schema validation**: Zod schemas in `src/lib/ai/schemas.ts`.
- **Drafts only**: AI never publishes; outputs land in
  `*_drafts` / `*_summaries` / `*_results` tables and the approval queue.
- **Safe in CI**: config detection, JSON parsing, schema validation, error
  classification.
- **Requires sandbox**: live model call, latency, real schema conformance,
  end-to-end draft creation.

## Setup diagnostics

`getServerConfigStatus` returns booleans only — see
`src/lib/setup.functions.ts`. The browser never sees secret values.
Redaction is covered by `src/lib/security/setup-redaction.test.ts`.

## Audit log

`audit_logs` rows are inserted server-side from approved publish and AI
flows. Payloads carry repo/draft IDs, not tokens or raw provider bodies.
Live capture is verified in sandbox.
