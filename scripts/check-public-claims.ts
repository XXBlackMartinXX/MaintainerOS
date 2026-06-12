#!/usr/bin/env bun
/**
 * Public-claims scanner.
 *
 * Scans every file in the repository (excluding the explicit allowlist
 * of files that legitimately mention forbidden phrases — the
 * product-copy module, its tests, this script, and a few "we do NOT
 * claim X" docs) for language we have committed to not shipping in any
 * public-facing surface.
 *
 * The phrases live in `src/lib/product-copy.ts` under `FORBIDDEN_COPY`,
 * plus a few extra phrases that only matter outside `src/` (release
 * notes, README, changelog, blog posts).
 *
 * Exits non-zero if any match is found. Wired into CI between
 * `check:rls` and `build`.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { FORBIDDEN_COPY } from "../src/lib/product-copy";

const EXTRA_FORBIDDEN = [
  "anthropic approved",
  "anthropic partnership",
  "officially endorsed",
  "vulnerability-free",
  "100% secure",
  "battle-tested",
  "millions of users",
  "trusted by",
];

const ALLOWED = [
  "src/lib/product-copy.ts",
  "src/lib/reliability/product-copy.test.ts",
  "scripts/check-public-claims.ts",
  // Docs that explicitly enumerate forbidden language as a guardrail:
  "docs/PRODUCTION_READINESS.md",
  "docs/OWNER_LAUNCH_CHECKLIST.md",
  "docs/REVIEWER_WALKTHROUGH.md",
  "docs/CLAUDE_FOR_OSS_APPLICATION.md",
  "docs/RELEASE_CHECKLIST.md",
];

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".wrangler",
  ".lovable",
  ".vinxi",
  "src/routeTree.gen.ts",
]);

const TEXT_EXT = /\.(ts|tsx|js|jsx|md|mdx|yml|yaml|json|html|css|sql)$/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const rel = relative(process.cwd(), p);
    if (SKIP_DIRS.has(entry) || SKIP_DIRS.has(rel)) continue;
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (TEXT_EXT.test(entry)) out.push(p);
  }
  return out;
}

const phrases = [
  ...FORBIDDEN_COPY.map((p) => p.toLowerCase()),
  ...EXTRA_FORBIDDEN.map((p) => p.toLowerCase()),
];

const files = walk(process.cwd());
const offenders: { file: string; phrase: string; line: number }[] = [];

for (const file of files) {
  const rel = relative(process.cwd(), file);
  if (ALLOWED.includes(rel)) continue;
  const text = readFileSync(file, "utf8");
  const lower = text.toLowerCase();
  for (const phrase of phrases) {
    if (lower.includes(phrase)) {
      // find first line for reporting
      const idx = lower.indexOf(phrase);
      const line = text.slice(0, idx).split("\n").length;
      offenders.push({ file: rel, phrase, line });
    }
  }
}

if (offenders.length > 0) {
  console.error(`FAIL — public-claims scan found ${offenders.length} match(es):`);
  for (const o of offenders) {
    console.error(`  ${o.file}:${o.line}  "${o.phrase}"`);
  }
  console.error(
    "\nIf a match is intentional (e.g. a 'we do NOT claim X' doc), add the file to the\nALLOWED list in scripts/check-public-claims.ts.",
  );
  process.exit(1);
}

console.log(`OK — public-claims scan clean (${files.length} files, ${phrases.length} phrases).`);
