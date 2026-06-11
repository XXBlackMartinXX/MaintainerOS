/**
 * Static RLS policy checks.
 *
 * Parses the SQL files under `supabase/migrations/` and verifies the
 * access-control invariants documented in `docs/RLS_ACCESS_CONTROL.md`.
 *
 * These checks do NOT prove runtime RLS behavior. They guard the migration
 * surface against accidental regressions (e.g. someone adds an UPDATE policy
 * to a draft table, or removes RLS from a table). Runtime verification is
 * covered by `docs/RLS_TEST_PLAN.md`.
 */

export type ParsedPolicy = {
  table: string;
  name: string;
  command: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "ALL";
  using: string | null;
  withCheck: string | null;
};

export type ParsedMigrations = {
  rlsEnabledTables: Set<string>;
  policies: ParsedPolicy[];
};

const RLS_ENABLE_RE = /alter\s+table\s+public\.([a-z_]+)\s+enable\s+row\s+level\s+security\s*;/gi;
const DROP_POLICY_RE =
  /drop\s+policy\s+(?:if\s+exists\s+)?"([^"]+)"\s+on\s+public\.([a-z_]+)\s*;/gi;
const POLICY_HEAD_RE =
  /create\s+policy\s+"([^"]+)"\s+on\s+public\.([a-z_]+)\s+(?:as\s+\w+\s+)?for\s+(select|insert|update|delete|all)\b\s*(?:to\s+[a-z_, ]+)?/gi;

/** Read a balanced-paren expression starting at `start` (which is the `(`). Returns the inner body and the index after the closing `)`. */
function readBalanced(s: string, start: number): { body: string; end: number } | null {
  if (s[start] !== "(") return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (c === "(") depth++;
    else if (c === ")") {
      depth--;
      if (depth === 0) return { body: s.slice(start + 1, i), end: i + 1 };
    }
  }
  return null;
}

export function parseMigrations(sqlFiles: { name: string; sql: string }[]): ParsedMigrations {
  const rlsEnabledTables = new Set<string>();
  let policies: ParsedPolicy[] = [];

  const sorted = [...sqlFiles].sort((a, b) => a.name.localeCompare(b.name));

  for (const { sql } of sorted) {
    const lower = sql.toLowerCase();

    for (const m of lower.matchAll(RLS_ENABLE_RE)) {
      rlsEnabledTables.add(m[1]!);
    }

    // Collect create/drop events with positions so we can apply them in document order.
    type Event =
      | { kind: "create"; pos: number; policy: ParsedPolicy; end: number }
      | { kind: "drop"; pos: number; name: string; table: string };
    const events: Event[] = [];

    POLICY_HEAD_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = POLICY_HEAD_RE.exec(lower)) !== null) {
      const matchStart = m.index;
      const name = m[1]!;
      const table = m[2]!;
      const cmd = m[3]!.toUpperCase() as ParsedPolicy["command"];
      let cursor = POLICY_HEAD_RE.lastIndex;
      let using: string | null = null;
      let withCheck: string | null = null;

      const usingMatch = /\s*using\s*\(/y;
      usingMatch.lastIndex = cursor;
      const ut = usingMatch.exec(lower);
      if (ut) {
        const parenIdx = cursor + ut[0]!.length - 1;
        const r = readBalanced(lower, parenIdx);
        if (r) {
          using = r.body.trim();
          cursor = r.end;
        }
      }

      const withMatch = /\s*with\s+check\s*\(/y;
      withMatch.lastIndex = cursor;
      const wt = withMatch.exec(lower);
      if (wt) {
        const parenIdx = cursor + wt[0]!.length - 1;
        const r = readBalanced(lower, parenIdx);
        if (r) {
          withCheck = r.body.trim();
          cursor = r.end;
        }
      }

      events.push({
        kind: "create",
        pos: matchStart,
        end: cursor,
        policy: { table, name, command: cmd, using, withCheck },
      });
      POLICY_HEAD_RE.lastIndex = cursor;
    }

    for (const dm of lower.matchAll(DROP_POLICY_RE)) {
      events.push({ kind: "drop", pos: dm.index!, name: dm[1]!, table: dm[2]! });
    }

    events.sort((a, b) => a.pos - b.pos);
    for (const ev of events) {
      if (ev.kind === "create") {
        policies.push(ev.policy);
      } else {
        policies = policies.filter((p) => !(p.name === ev.name && p.table === ev.table));
      }
    }
  }

  return { rlsEnabledTables, policies };
}

/** Tables that MUST have RLS enabled. */
export const REQUIRED_RLS_TABLES = [
  "profiles",
  "settings",
  "repositories",
  "repository_memberships",
  "issues",
  "pull_requests",
  "commits",
  "contributors",
  "labels",
  "issue_triage_results",
  "pull_request_ai_summaries",
  "documentation_drafts",
  "release_drafts",
  "github_publish_events",
  "audit_logs",
  "sync_jobs",
  "user_github_tokens",
] as const;

/** Tables that must have ZERO user-facing policies (service-role only). */
export const SERVICE_ROLE_ONLY_TABLES = ["user_github_tokens"] as const;

/** Repo-scoped catalog tables: SELECT only via has_repo_access; no I/U/D policies. */
export const REPO_CATALOG_TABLES = [
  "repositories",
  "issues",
  "pull_requests",
  "commits",
  "contributors",
  "labels",
] as const;

/** Draft tables: must NOT have a user-facing UPDATE policy. */
export const DRAFT_TABLES = [
  "issue_triage_results",
  "pull_request_ai_summaries",
  "documentation_drafts",
  "release_drafts",
] as const;

export type CheckIssue = { id: string; message: string };

export function runChecks(parsed: ParsedMigrations): CheckIssue[] {
  const issues: CheckIssue[] = [];
  const { rlsEnabledTables, policies } = parsed;
  const byTable = (t: string) => policies.filter((p) => p.table === t);

  // RLS enabled on every required table
  for (const t of REQUIRED_RLS_TABLES) {
    if (!rlsEnabledTables.has(t)) {
      issues.push({ id: "RLS_ENABLED", message: `Table ${t} does not have RLS enabled.` });
    }
  }

  // Permissive-policy ban (P-1)
  for (const p of policies) {
    const u = p.using ?? "";
    const w = p.withCheck ?? "";
    if (/^\s*true\s*$/i.test(u) || /^\s*true\s*$/i.test(w)) {
      issues.push({
        id: "PERMISSIVE_POLICY",
        message: `Policy "${p.name}" on ${p.table} uses USING/WITH CHECK (true).`,
      });
    }
  }

  // Service-role-only tables must have zero policies (T-1)
  for (const t of SERVICE_ROLE_ONLY_TABLES) {
    const ps = byTable(t);
    if (ps.length > 0) {
      issues.push({
        id: "SERVICE_ROLE_ONLY",
        message: `Table ${t} must have no policies (service-role only); found ${ps.length}.`,
      });
    }
  }

  // Repo-catalog tables: SELECT must reference has_repo_access; no INSERT/UPDATE/DELETE policies (R-1, R-3)
  for (const t of REPO_CATALOG_TABLES) {
    const ps = byTable(t);
    const selects = ps.filter((p) => p.command === "SELECT" || p.command === "ALL");
    if (selects.length === 0) {
      issues.push({ id: "REPO_SELECT_MISSING", message: `Table ${t} has no SELECT policy.` });
    }
    for (const s of selects) {
      const u = (s.using ?? "") + " " + (s.withCheck ?? "");
      if (!/has_repo_access\(/i.test(u)) {
        issues.push({
          id: "REPO_SELECT_HAS_ACCESS",
          message: `SELECT policy "${s.name}" on ${t} does not call has_repo_access.`,
        });
      }
    }
    for (const cmd of ["INSERT", "UPDATE", "DELETE"] as const) {
      const writePolicies = ps.filter((p) => p.command === cmd || p.command === "ALL");
      if (writePolicies.length > 0) {
        issues.push({
          id: "REPO_NO_WRITE_POLICY",
          message: `Repo catalog ${t} must not have a ${cmd} policy (found "${writePolicies[0]!.name}").`,
        });
      }
    }
  }

  // Draft tables: INSERT requires user_id + has_repo_access, NO UPDATE policy (R-2, D-1)
  for (const t of DRAFT_TABLES) {
    const ps = byTable(t);
    const inserts = ps.filter((p) => p.command === "INSERT" || p.command === "ALL");
    if (inserts.length === 0) {
      issues.push({
        id: "DRAFT_INSERT_MISSING",
        message: `Draft table ${t} has no INSERT policy.`,
      });
    }
    for (const i of inserts) {
      const w = i.withCheck ?? "";
      if (!/auth\.uid\(\)\s*=\s*user_id/i.test(w) || !/has_repo_access\(/i.test(w)) {
        issues.push({
          id: "DRAFT_INSERT_CHECK",
          message: `INSERT policy "${i.name}" on ${t} must check auth.uid() = user_id AND has_repo_access.`,
        });
      }
    }
    const updates = ps.filter((p) => p.command === "UPDATE" || p.command === "ALL");
    if (updates.length > 0) {
      issues.push({
        id: "DRAFT_NO_UPDATE",
        message: `Draft table ${t} must not have a user-facing UPDATE policy (found "${updates[0]!.name}").`,
      });
    }
    const selects = ps.filter((p) => p.command === "SELECT" || p.command === "ALL");
    for (const s of selects) {
      if (!/auth\.uid\(\)\s*=\s*user_id/i.test(s.using ?? "")) {
        issues.push({
          id: "DRAFT_SELF_READ",
          message: `SELECT policy "${s.name}" on ${t} must check auth.uid() = user_id.`,
        });
      }
    }
  }

  // github_publish_events: self-read only, no INSERT policy (D-2, U-3)
  {
    const ps = byTable("github_publish_events");
    const inserts = ps.filter((p) => p.command === "INSERT" || p.command === "ALL");
    if (inserts.length > 0) {
      issues.push({
        id: "PUBLISH_NO_INSERT",
        message: `github_publish_events must not have an INSERT policy (found "${inserts[0]!.name}").`,
      });
    }
    const selects = ps.filter((p) => p.command === "SELECT" || p.command === "ALL");
    if (selects.length === 0) {
      issues.push({
        id: "PUBLISH_SELF_READ",
        message: "github_publish_events is missing a self-read policy.",
      });
    }
    for (const s of selects) {
      if (!/auth\.uid\(\)\s*=\s*user_id/i.test(s.using ?? "")) {
        issues.push({
          id: "PUBLISH_SELF_READ",
          message: `SELECT policy "${s.name}" on github_publish_events must check auth.uid() = user_id.`,
        });
      }
    }
  }

  // sync_jobs: self-read only, no INSERT/UPDATE/DELETE policy (A-2)
  {
    const ps = byTable("sync_jobs");
    for (const cmd of ["INSERT", "UPDATE", "DELETE"] as const) {
      const w = ps.filter((p) => p.command === cmd || p.command === "ALL");
      if (w.length > 0) {
        issues.push({
          id: "SYNC_NO_WRITE",
          message: `sync_jobs must not have a ${cmd} policy (found "${w[0]!.name}").`,
        });
      }
    }
  }

  // audit_logs: self-read + self-insert, no UPDATE/DELETE (A-1)
  {
    const ps = byTable("audit_logs");
    for (const cmd of ["UPDATE", "DELETE"] as const) {
      const w = ps.filter((p) => p.command === cmd || p.command === "ALL");
      if (w.length > 0) {
        issues.push({
          id: "AUDIT_APPEND_ONLY",
          message: `audit_logs must not have a ${cmd} policy (found "${w[0]!.name}").`,
        });
      }
    }
  }

  return issues;
}

export async function loadMigrations(dir: string): Promise<{ name: string; sql: string }[]> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const entries = await fs.readdir(dir);
  const out: { name: string; sql: string }[] = [];
  for (const name of entries) {
    if (!name.endsWith(".sql")) continue;
    const sql = await fs.readFile(path.join(dir, name), "utf8");
    out.push({ name, sql });
  }
  return out;
}
