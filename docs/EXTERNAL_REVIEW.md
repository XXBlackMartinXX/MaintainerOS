# External Review Package

This document is a starting point for an **external security or quality
reviewer** examining MaintainerOS. It is also the package referenced
when requesting community or sponsor-funded review. It explicitly does
**not** assert that any external review has been completed, and nothing
in this repository should be read as Anthropic-approved or
formally-audited.

## 1. What kind of review we are asking for

In rough order of value:

1. **Access-control review** — does Postgres row-level security
   actually isolate user data and repository data, given the policies
   under `supabase/migrations/` and the static + runtime checks
   referenced below?
2. **AI-safety review** — can any code path cause an AI model to make
   a live GitHub write, escape the "draft only" model, or leak secrets
   through prompt construction or logs?
3. **GitHub-write safety review** — is the approval-gated publishing
   flow tamper-resistant against a malicious or buggy client?
4. **Secret hygiene review** — do any client bundles, error messages,
   logs, or audit rows ever contain a service-role key, GitHub token,
   AI key, or session token?
5. **Supply-chain review** — workflow permissions, third-party action
   usage, dependency posture, lockfile integrity.

A reviewer is welcome to look at anything else they find interesting.

## 2. What is explicitly **out of scope** for this round

- Performance / scalability tuning.
- Feature completeness.
- UI/UX polish.
- Marketing or copy review (handled by `bun run check:claims`).
- Anything that requires production credentials — we do not have a
  hosted production deployment to test against.
- Any test that would require live GitHub writes against a real
  third-party repository.

## 3. Recommended reading order

1. `README.md` — what the project is and what it is not.
2. `docs/PRODUCTION_READINESS.md` — current honest status.
3. `docs/THREAT_MODEL.md` — assets, actors, trust boundaries.
4. `docs/SECURITY_MODEL.md` — high-level safety properties.
5. `docs/AI_SAFETY.md` — drafts-only model, human approval gate.
6. `docs/GITHUB_INTEGRATION.md` + `docs/GITHUB_WRITE_SAFETY.md`
   *(if present)* — write surface, approval flow.
7. `docs/RLS_ACCESS_CONTROL.md` — invariants U-1, U-2, R-1, R-2,
   D-1, D-2, T-1, A-1.
8. `docs/RLS_TEST_PLAN.md` — how those invariants are verified
   statically and at runtime.
9. `docs/INTEGRATION_BOUNDARIES.md` — per-integration boundary audit.
10. `docs/SANDBOX_VERIFICATION.md` — owner-run live verification path.
11. `docs/SUPABASE_RLS.md` and `supabase/migrations/` — actual policies.

## 4. Suggested verification commands

All commands are non-destructive and require no production credentials.
A CI-style run:

```bash
bun install --frozen-lockfile
bun run typecheck
bun run test
bun run check:rls
bun run check:claims
bun run check:repo
bun run build
```

Runtime RLS (requires a **local** Postgres; never run against a managed
or production host):

```bash
# See docs/RLS_TEST_PLAN.md for setup. The script refuses to run
# against managed hosts.
DATABASE_URL=postgres://... bun run test:rls:runtime
```

Local config classifier (no secret values printed, ever):

```bash
bun run sandbox:preflight
```

## 5. Areas we want extra scrutiny on

- **`src/integrations/supabase/client.server.ts`** and every site that
  imports it. Confirm it is never reachable from a client bundle.
- **`src/lib/github/write.server.ts`** — the only module that performs
  GitHub writes. Confirm every entry point requires an approved draft
  and an authenticated user with appropriate scoping.
- **`src/lib/approval-queue/queue.ts`** — confirm a forged client
  request cannot bypass approval.
- **`src/lib/ai/provider.server.ts`** — confirm AI calls cannot be
  triggered from an unauthenticated path and never include
  service-role context.
- **RLS policies on `user_github_tokens`** — confirm zero policies for
  `anon` and `authenticated`, confirmed by
  `src/lib/security/rls-policy-checks.ts`.
- **`scripts/check-public-claims.ts`** — confirm the allowlist is
  conservative and is not hiding real claim drift.

## 6. Known limitations a reviewer should be aware of

- The runtime RLS harness is owner-run, not yet a required CI step.
- There are no live OAuth, live GitHub, or live AI integration tests
  in CI.
- There is no Playwright / browser end-to-end suite.
- There is no formal third-party security audit.
- The hosted preview is a public deployment; it is not a production
  environment and has no SLA.
- The GitHub OAuth scope model is broader than ideal for sensitive
  repositories; the GitHub App migration is tracked in
  `docs/GITHUB_APP_MIGRATION_PLAN.md`.

## 7. How to report findings privately

- **Preferred:** GitHub **private vulnerability reporting** on this
  repository, once it has been enabled by the owner
  (see `docs/REPOSITORY_OPERATIONS.md` §1).
- **Fallback:** open a minimal public issue titled
  *"Security contact requested"* asking the owner to enable private
  vulnerability reporting. **Do not include vulnerability details in a
  public issue.**

See `SECURITY.md` for the full disclosure policy and safe-harbor
language.

## 8. What this document does **not** promise

- It does **not** assert that the project has been externally audited.
- It does **not** assert that the project is production-ready.
- It does **not** assert any compliance certification.
- It does **not** offer a bug bounty.

These limits are deliberate. Updating them requires a corresponding
update to `docs/PRODUCTION_READINESS.md`.
