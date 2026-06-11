# Testing

MaintainerOS uses [Vitest](https://vitest.dev) for unit tests. The suite is
deterministic, runs in jsdom, and **never** makes live calls to Supabase,
GitHub, or the AI gateway. CI runs `bun run test` between lint and build.

## Running locally

```bash
bun install
bun run test         # one-shot
bun run test:watch   # interactive
```

No secrets are required. Tests do not read `.env`.

## What is covered

| Area                 | File                                     | What it asserts                                                                                                                                                |
| -------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Env / feature gating | `src/lib/env.test.ts`                    | `hasFeature` / `requireFeature` correctly detect missing Supabase, AI gateway, GitHub OAuth; error messages do not leak secret values.                         |
| Demo mode            | `src/hooks/use-demo-mode.test.ts`        | `enableDemoMode` uses the stable `mos.demoMode` key, is idempotent, dispatches the `mos:demo-mode` event, and does not require Supabase.                       |
| AI response schemas  | `src/lib/ai/schemas.test.ts`             | Triage, PR summary, changelog, and documentation Zod schemas accept valid drafts and reject unknown enums, out-of-range confidence, and empty required fields. |
| Publish helpers      | `src/components/publish-helpers.test.ts` | `getPublishEventForSource` filters by status; `formatPublishedAt` returns relative time and falls back safely on invalid input.                                |
| RLS static policies  | `src/lib/security/rls-policy-checks.test.ts` | Parses `supabase/migrations/` and asserts every access-control invariant in `docs/RLS_ACCESS_CONTROL.md` (RLS enabled, no permissive policies, draft tables have no UPDATE policy, `user_github_tokens` has zero policies, etc.). |

The same RLS checks can be run independently via `bun run check:rls`, which
CI also invokes between `bun run test` and `bun run build`. Static checks
guard against accidental migration regressions; runtime allow/deny verification
remains manual — see `docs/RLS_TEST_PLAN.md`.

## What is intentionally mocked or skipped

- **No network calls.** Server functions (`src/lib/*.functions.ts`) talk to
  Supabase and GitHub through the admin client and per-user OAuth tokens.
  Exercising them in unit tests would require real credentials, so they are
  out of scope here.
- **No real AI calls.** Only the response schemas are tested; the gateway
  itself is exercised manually.
- **No router/auth integration.** Route components are not rendered in
  tests — TanStack Router, Supabase Auth, and React Query would each need a
  significant harness.

## What is not covered yet

- Server-function happy paths and error paths (would need a local Postgres
  with the `supabase/migrations/` schema applied).
- Row-level security policies (allow vs deny).
- GitHub API client behaviour (would need a mocked fetch layer).
- End-to-end UI flows (Playwright is deferred — see below).

## Future tests

1. **Integration tests** against a local Postgres with migrations applied,
   asserting RLS via `has_repo_access`.
2. **GitHub client tests** with a `fetch` mock — never against a real token.
3. **Playwright E2E** of the public marketing routes, `/demo`, `/login`
   (unconfigured state), and `/setup` once a stable preview is available.

## Production readiness

The current suite raises the credibility of the public preview but does
**not** by itself unblock a 1.0 production claim — integration and E2E
coverage are still required, plus a real audit of RLS policies and the
publish/approval pipeline.
