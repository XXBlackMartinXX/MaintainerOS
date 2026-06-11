# Testing

MaintainerOS does **not** currently ship an automated test suite. Quality is
enforced by `bun run lint`, `bun run typecheck`, `bun run build`, and a
manual smoke-test checklist. **Production readiness is blocked until a real
test suite exists.**

This document records the recommended future plan so that contributions can
land against a shared target.

## Current gap

- No unit tests.
- No integration tests against the database or GitHub API.
- No end-to-end tests of the UI flows.
- No CI test job (CI currently runs lint, typecheck, and build only — see
  `.github/workflows/ci.yml`).

## Recommended future test plan

### 1. Unit tests (Vitest)

Highest-value pure-logic targets, in priority order:

- `src/lib/env.ts` — environment detection and feature gating.
- `src/hooks/use-demo-mode.ts` and `src/lib/demo-data.ts` — demo mode
  helpers and sample data shape.
- `src/lib/ai/schemas.ts` — Zod schema validation for every AI response
  shape (triage, PR summary, changelog, docs).
- `src/components/publish-helpers.tsx` and the duplicate-protection logic
  used by `src/lib/github-publish.functions.ts`.

These tests should not require network access, secrets, or a live Supabase
or GitHub connection.

### 2. Integration tests

- Server functions in `src/lib/*.functions.ts` exercised against a local
  Postgres with the migrations in `supabase/migrations/` applied.
- Row-level security policies verified via the `has_repo_access` security
  definer function (both allow and deny paths).
- GitHub API client (`src/lib/github/*.server.ts`) exercised against a
  mocked fetch layer — never against a real token in CI.

### 3. End-to-end tests (Playwright)

- Public marketing routes render and link correctly.
- `/demo` enters demo mode and disables every publish/sync button with the
  expected tooltip copy.
- `/login` reflects the configured-vs-unconfigured Supabase state.
- `/setup` diagnostics page renders all rows.

E2E tests must run against demo mode or stubbed backends — never against a
real user's GitHub account.

## Constraints

- Tests must not require real Supabase service role keys, GitHub tokens, or
  AI gateway keys.
- Tests must not call the live GitHub API or post to any real repository.
- Tests must not depend on Lovable-specific runtime behaviour.
