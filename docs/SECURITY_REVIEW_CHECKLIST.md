# Security Review Checklist

A practical checklist for maintainers reviewing a MaintainerOS change before
merge or release. This is **advisory** — it complements, not replaces, code
review and the broader threat model in `docs/THREAT_MODEL.md`.

## Secrets and environment

- [ ] No secret values appear in any committed file. `.env` is gitignored.
- [ ] New env vars are added to `.env.example` with safe placeholder values.
- [ ] Browser code only reads `import.meta.env.VITE_*`.
- [ ] Server code reads `process.env.*` **inside** `.handler()`, not at module scope.
- [ ] `client.server.ts` is imported only via `await import()` from
      client-reachable modules (`*.functions.ts`, route files).
- [ ] Error messages and console logs do not include token, key, or session values.

## Supabase / RLS

- [ ] Every new `public` table has explicit `GRANT` statements in the same
      migration, plus `ENABLE ROW LEVEL SECURITY` and at least one policy.
- [ ] Self-scoped tables use `auth.uid() = user_id` on both `using` and
      `with check`.
- [ ] Repo-scoped tables use `has_repo_access(auth.uid(), repository_id)`.
- [ ] No new `TO anon` policies unless the table is intentionally fully public.
- [ ] `supabase--linter` reports no critical or warning-level findings for
      the changes.

## GitHub OAuth and write actions

- [ ] OAuth scopes requested are the minimum needed for the feature.
- [ ] New write paths go through `evaluateWritePermissions` before calling
      GitHub.
- [ ] Each new write server fn requires `confirm: true` in its
      `inputValidator` and is wired to a UI confirmation dialog.
- [ ] Each new write path inserts a row into `github_publish_events` and
      `audit_logs` (attempted / success / failed).
- [ ] Duplicate-protection lookup happens before any GitHub call.
- [ ] Releases remain `draft: true`. There is no code path that publishes a
      non-draft release.

## AI output handling

- [ ] Every AI response is parsed through a Zod schema in `src/lib/ai/schemas.ts`.
- [ ] UI labels AI-generated content as "AI draft".
- [ ] No AI output is forwarded to GitHub without an explicit user click.
- [ ] Prompt does not include secrets or unrelated user data.

## Audit logs

- [ ] New write actions append to `audit_logs` with `action`, `target_type`,
      `target_id`, and `metadata` that excludes secret values.
- [ ] Failure paths log a `*.failed` action with a short error message
      (never a raw stack trace).

## Dependencies

- [ ] `bun update --dry-run` reviewed. No unexpected major bumps slipped in.
- [ ] No new dependency requires Node-only APIs that break the Cloudflare
      Worker runtime (see `docs/ARCHITECTURE.md`).

## CI / tests

- [ ] `bun run typecheck`, `bun run lint`, `bun run test`, `bun run build`
      all pass locally and on CI.
- [ ] New security-sensitive logic has at least one Vitest assertion.
- [ ] Tests do not require real Supabase, GitHub, or AI credentials.

## Release / publish

- [ ] Visibility of repo / Lovable preview matches the documented status.
- [ ] `CHANGELOG.md` accurately describes what changed.
- [ ] `SECURITY.md` reporting channel is current.
- [ ] No claim of SOC 2 / ISO / pentest / "production-ready security" has
      been added to README, docs, or marketing copy.

## Documentation claims

- [ ] Wording on `app.security`, `app.trust`, `app.readiness` remains
      explicitly advisory.
- [ ] No new copy implies certification, formal audit, or vulnerability-free
      status.
- [ ] Demo mode is clearly labeled wherever fixture data is shown.
