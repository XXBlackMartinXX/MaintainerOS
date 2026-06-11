#!/usr/bin/env bun
/**
 * Static RLS policy assertion runner.
 *
 * Usage:  bun run check:rls
 *
 * Parses supabase/migrations/ and reports any deviation from the invariants
 * documented in docs/RLS_ACCESS_CONTROL.md. Exit code 1 on findings.
 */
import path from "node:path";
import { loadMigrations, parseMigrations, runChecks } from "../src/lib/security/rls-policy-checks";

const dir = path.resolve(process.cwd(), "supabase/migrations");
const files = await loadMigrations(dir);
const parsed = parseMigrations(files);
const issues = runChecks(parsed);

if (issues.length === 0) {
  console.log(`OK — RLS policy checks passed (${files.length} migrations, ${parsed.policies.length} policies).`);
  process.exit(0);
}

console.error(`FAIL — ${issues.length} RLS policy issue(s):`);
for (const i of issues) {
  console.error(`  [${i.id}] ${i.message}`);
}
process.exit(1);
