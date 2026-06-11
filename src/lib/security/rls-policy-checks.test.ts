import { describe, it, expect } from "vitest";
import {
  loadMigrations,
  parseMigrations,
  runChecks,
  REQUIRED_RLS_TABLES,
  SERVICE_ROLE_ONLY_TABLES,
  DRAFT_TABLES,
} from "./rls-policy-checks";
import path from "node:path";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "supabase/migrations");

describe("RLS static policy checks (Option B)", () => {
  it("parses migrations and runs all invariant checks without findings", async () => {
    const files = await loadMigrations(MIGRATIONS_DIR);
    expect(files.length).toBeGreaterThan(0);
    const parsed = parseMigrations(files);

    // RLS enabled on every required table
    for (const t of REQUIRED_RLS_TABLES) {
      expect(parsed.rlsEnabledTables, `RLS must be enabled on ${t}`).toContain(t);
    }

    // Service-role-only tables have zero policies
    for (const t of SERVICE_ROLE_ONLY_TABLES) {
      const ps = parsed.policies.filter((p) => p.table === t);
      expect(ps, `${t} must have zero policies`).toHaveLength(0);
    }

    // Draft tables have no UPDATE policy
    for (const t of DRAFT_TABLES) {
      const updates = parsed.policies.filter(
        (p) => p.table === t && (p.command === "UPDATE" || p.command === "ALL"),
      );
      expect(updates, `${t} must have no UPDATE policy`).toHaveLength(0);
    }

    // github_publish_events has no INSERT policy
    const publishInserts = parsed.policies.filter(
      (p) => p.table === "github_publish_events" && (p.command === "INSERT" || p.command === "ALL"),
    );
    expect(publishInserts).toHaveLength(0);

    // No issues from the full invariant runner
    const issues = runChecks(parsed);
    expect(issues, JSON.stringify(issues, null, 2)).toEqual([]);
  });

  it("detects a permissive USING (true) policy if introduced", () => {
    const parsed = parseMigrations([
      {
        name: "test.sql",
        sql: `alter table public.profiles enable row level security;
              create policy "broken" on public.profiles for select using (true);`,
      },
    ]);
    const issues = runChecks(parsed);
    expect(issues.some((i) => i.id === "PERMISSIVE_POLICY")).toBe(true);
  });

  it("detects an UPDATE policy added to a draft table", () => {
    const parsed = parseMigrations([
      {
        name: "test.sql",
        sql: `alter table public.documentation_drafts enable row level security;
              create policy "bad self update" on public.documentation_drafts for update using (auth.uid() = user_id);`,
      },
    ]);
    const issues = runChecks(parsed);
    expect(issues.some((i) => i.id === "DRAFT_NO_UPDATE")).toBe(true);
  });

  it("detects an INSERT policy added to github_publish_events", () => {
    const parsed = parseMigrations([
      {
        name: "test.sql",
        sql: `alter table public.github_publish_events enable row level security;
              create policy "bad self insert" on public.github_publish_events for insert with check (auth.uid() = user_id);`,
      },
    ]);
    const issues = runChecks(parsed);
    expect(issues.some((i) => i.id === "PUBLISH_NO_INSERT")).toBe(true);
  });

  it("detects a draft INSERT policy missing has_repo_access", () => {
    const parsed = parseMigrations([
      {
        name: "test.sql",
        sql: `alter table public.release_drafts enable row level security;
              create policy "weak insert" on public.release_drafts for insert with check (auth.uid() = user_id);`,
      },
    ]);
    const issues = runChecks(parsed);
    expect(issues.some((i) => i.id === "DRAFT_INSERT_CHECK")).toBe(true);
  });

  it("respects DROP POLICY across migrations", () => {
    const parsed = parseMigrations([
      {
        name: "1.sql",
        sql: `alter table public.documentation_drafts enable row level security;
              create policy "docs self update" on public.documentation_drafts for update using (auth.uid() = user_id);`,
      },
      {
        name: "2.sql",
        sql: `drop policy if exists "docs self update" on public.documentation_drafts;`,
      },
    ]);
    expect(parsed.policies.filter((p) => p.name === "docs self update")).toHaveLength(0);
  });
});
