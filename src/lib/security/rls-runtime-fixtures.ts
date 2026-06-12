/**
 * Deterministic fixture identifiers shared by `scripts/rls-runtime-tests.sql`.
 *
 * Kept in TypeScript so unit tests can assert that the values are
 * well-formed UUIDs and that the SQL harness file references them. The SQL
 * harness is the source of truth for what the runtime test actually does —
 * this module exists so a future Node-based harness can reuse the same IDs
 * without drift.
 */
export const RLS_RUNTIME_FIXTURES = {
  userA: "11111111-1111-1111-1111-111111111111",
  userB: "22222222-2222-2222-2222-222222222222",
  repoA: "33333333-3333-3333-3333-333333333333",
  repoB: "44444444-4444-4444-4444-444444444444",
} as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Invariant IDs covered by the runtime harness. Mirror docs/RLS_ACCESS_CONTROL.md.
 * Used by the unit test to detect drift between docs, static checks, and runtime.
 */
export const RLS_RUNTIME_COVERED_INVARIANTS = [
  "U-1",
  "U-2",
  "R-1",
  "R-2",
  "D-1",
  "D-2",
  "T-1",
  "A-1",
] as const;
