#!/usr/bin/env bun
/**
 * Repository operations coverage check.
 *
 * Verifies that the files this project commits to maintaining — CI
 * workflows, Dependabot config, issue/PR templates, security and
 * operations docs — actually exist and contain the headings they are
 * supposed to contain. This is intentionally a *file presence* +
 * *structural* check, not a content audit. It does not validate that
 * the steps inside the docs have been performed (those are owner UI
 * tasks documented in docs/OWNER_LAUNCH_CHECKLIST.md).
 *
 * Exits non-zero on missing files or missing required markers.
 */
import { existsSync, readFileSync, statSync } from "node:fs";

type Required = {
  path: string;
  /** Strings that MUST appear somewhere in the file (case-insensitive). */
  mustContain?: string[];
};

const required: Required[] = [
  // Workflows
  {
    path: ".github/workflows/ci.yml",
    mustContain: ["typecheck", "check:rls", "check:claims", "build"],
  },
  { path: ".github/workflows/codeql.yml", mustContain: ["codeql", "languages"] },
  {
    path: ".github/workflows/dependency-review.yml",
    mustContain: ["dependency-review-action", "pull_request"],
  },

  // Dependabot
  {
    path: ".github/dependabot.yml",
    mustContain: ["package-ecosystem", "npm", "github-actions"],
  },

  // Issue / PR templates
  { path: ".github/pull_request_template.md" },
  { path: ".github/ISSUE_TEMPLATE/bug_report.yml" },
  { path: ".github/ISSUE_TEMPLATE/feature_request.yml" },
  { path: ".github/ISSUE_TEMPLATE/config.yml" },

  // Top-level governance
  { path: "README.md" },
  { path: "LICENSE" },
  { path: "SECURITY.md", mustContain: ["private vulnerability"] },
  { path: "CODE_OF_CONDUCT.md" },
  { path: "CONTRIBUTING.md" },
  { path: "CHANGELOG.md" },

  // Operations docs introduced or maintained by P9
  {
    path: "docs/REPOSITORY_OPERATIONS.md",
    mustContain: [
      "private vulnerability reporting",
      "secret scanning",
      "branch protection",
      "actions permissions",
    ],
  },
  {
    path: "docs/RELEASE_OPERATIONS.md",
    mustContain: ["tag", "draft", "rollback"],
  },
  {
    path: "docs/EXTERNAL_REVIEW.md",
    mustContain: ["out of scope", "report findings", "does"],
  },

  // P10 — final external review & submission package
  {
    path: "docs/FINAL_READINESS_REPORT.md",
    mustContain: ["status at a glance", "public preview", "production"],
  },
  {
    path: "docs/FINAL_OWNER_ACTIONS.md",
    mustContain: ["before the v0.1.0 draft release", "production"],
  },
  {
    path: "docs/CLAUDE_FOR_OSS_SUBMISSION_DRAFT.md",
    mustContain: ["safety model", "current limitations"],
  },

  // Cross-references from earlier phases that this check guards
  { path: "docs/PRODUCTION_READINESS.md" },
  { path: "docs/PRODUCTION_CHECKLIST.md" },
  { path: "docs/OWNER_LAUNCH_CHECKLIST.md" },
  { path: "docs/SANDBOX_VERIFICATION.md" },
  { path: "docs/INTEGRATION_BOUNDARIES.md" },
  { path: "docs/RLS_TEST_PLAN.md" },
  { path: "docs/THREAT_MODEL.md" },
];

const problems: string[] = [];

for (const r of required) {
  if (!existsSync(r.path)) {
    problems.push(`MISSING  ${r.path}`);
    continue;
  }
  const s = statSync(r.path);
  if (!s.isFile() || s.size === 0) {
    problems.push(`EMPTY    ${r.path}`);
    continue;
  }
  if (r.mustContain && r.mustContain.length > 0) {
    const lower = readFileSync(r.path, "utf8").toLowerCase();
    for (const needle of r.mustContain) {
      if (!lower.includes(needle.toLowerCase())) {
        problems.push(`MARKER   ${r.path}  (missing: "${needle}")`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`FAIL — check:repo found ${problems.length} issue(s):`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    "\nThese files are part of MaintainerOS's repository operations posture.\n" +
      "If a removal is intentional, update scripts/check-repo-ops.ts in the same PR.",
  );
  process.exit(1);
}

console.log(`OK — check:repo verified ${required.length} required path(s).`);
