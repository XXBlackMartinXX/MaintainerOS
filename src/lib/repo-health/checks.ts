import type { CheckStatus, RepoHealthCheck, RepoHealthInput } from "./types";

type DraftDoc = {
  key: string;
  name: string;
  docType: string;
  nextAction: string;
};

const DRAFT_DOCS: DraftDoc[] = [
  {
    key: "readme",
    name: "README",
    docType: "readme_suggestions",
    nextAction: "Generate README suggestions in Documentation.",
  },
  {
    key: "contributing",
    name: "CONTRIBUTING",
    docType: "contributing",
    nextAction: "Generate CONTRIBUTING draft in Documentation.",
  },
  {
    key: "code_of_conduct",
    name: "CODE_OF_CONDUCT",
    docType: "code_of_conduct",
    nextAction: "Generate Code of Conduct draft in Documentation.",
  },
  {
    key: "security_md",
    name: "SECURITY",
    docType: "security",
    nextAction: "Generate Security guidance in the Security page.",
  },
  {
    key: "issue_template",
    name: "Issue template",
    docType: "issue_template",
    nextAction: "Generate Issue template draft in Documentation.",
  },
  {
    key: "pr_template",
    name: "Pull request template",
    docType: "pull_request_template",
    nextAction: "Generate PR template draft in Documentation.",
  },
  {
    key: "release_process",
    name: "Release process",
    docType: "release_process",
    nextAction: "Generate Release process draft in Documentation.",
  },
  {
    key: "maintainer_guide",
    name: "Maintainer guide",
    docType: "maintainer_guide",
    nextAction: "Generate Maintainer guide draft in Documentation.",
  },
  {
    key: "contributor_onboarding",
    name: "Contributor onboarding",
    docType: "contributor_onboarding",
    nextAction: "Generate Contributor onboarding draft in Documentation.",
  },
];

/**
 * Advisory artifacts we cannot yet verify because MaintainerOS does not read
 * repository file contents. They appear in the health center as
 * `not_verified` so reviewers can see them as recommended without us
 * overclaiming presence.
 */
const UNVERIFIED_ARTIFACTS: Array<{ key: string; name: string; nextAction: string }> = [
  { key: "license_file", name: "LICENSE file", nextAction: "Commit a LICENSE file at the repository root." },
  { key: "ci_workflow", name: "CI workflow", nextAction: "Add a CI workflow (e.g. .github/workflows/ci.yml) running typecheck, lint, tests, and build." },
  { key: "changelog_file", name: "CHANGELOG", nextAction: "Maintain a CHANGELOG.md or generate release notes from PR summaries." },
  { key: "dependency_manifest", name: "Dependency manifest", nextAction: "Ensure a package.json / lockfile (or language equivalent) is committed." },
  { key: "env_example", name: ".env.example", nextAction: "Commit a .env.example documenting required environment variables (no secrets)." },
  { key: "screenshot_docs", name: "Screenshot / docs assets", nextAction: "Add screenshots or a docs/ folder showing the product in use." },
  { key: "testing_docs", name: "Testing documentation", nextAction: "Add docs explaining how to run tests locally and in CI." },
  { key: "rls_docs", name: "RLS / access-control documentation", nextAction: "If you use Supabase or another row-level DB, document policies and access model." },
  { key: "production_readiness_docs", name: "Production-readiness documentation", nextAction: "Document deployment, secrets, monitoring, and the production-readiness checklist." },
];

/**
 * Classify draft availability for one document type.
 * A draft alone never proves the file lives in the repo — only that an
 * AI-assisted starting point exists. We therefore use "partial" (not "present")
 * to avoid overclaiming.
 */
export function classifyDraftStatus(approvalStatus: string | undefined): CheckStatus {
  if (!approvalStatus) return "missing";
  if (approvalStatus === "approved") return "partial";
  return "partial";
}

export function buildRepoHealthChecks(input: RepoHealthInput): RepoHealthCheck[] {
  const checks: RepoHealthCheck[] = [];

  for (const d of DRAFT_DOCS) {
    const status = classifyDraftStatus(input.draftStatusByType[d.docType]);
    const approval = input.draftStatusByType[d.docType];
    checks.push({
      key: d.key,
      name: d.name,
      status,
      confidence: "low",
      evidence:
        status === "missing"
          ? "No AI draft generated yet."
          : `AI draft (${approval}) exists in MaintainerOS.`,
      limitation:
        "MaintainerOS does not yet read repository file contents — a draft does not prove the file is committed.",
      nextAction: status === "missing" ? d.nextAction : "Edit the draft and commit it to the repo.",
    });
  }

  checks.push({
    key: "sync_freshness",
    name: "Recent sync freshness",
    status:
      input.syncFreshDays === null
        ? "missing"
        : input.syncFreshDays <= 1
          ? "present"
          : input.syncFreshDays <= 7
            ? "partial"
            : "missing",
    confidence: "high",
    evidence:
      input.syncFreshDays === null
        ? "No successful sync recorded."
        : `Last sync finished ${input.syncFreshDays} day${input.syncFreshDays === 1 ? "" : "s"} ago.`,
    nextAction: "Run a sync from the dashboard.",
  });

  for (const a of UNVERIFIED_ARTIFACTS) {
    checks.push({
      key: a.key,
      name: a.name,
      status: "not_verified",
      confidence: "low",
      evidence: "Advisory check. MaintainerOS does not yet read repository file contents.",
      limitation:
        "Presence of this file is not verified against the live repository tree.",
      nextAction: a.nextAction,
    });
  }

  checks.push({
    key: "write_scope",
    name: "GitHub write scope",
    status: input.hasWriteScope ? "present" : "missing",
    confidence: "high",
    evidence: input.hasWriteScope
      ? "OAuth token reports a `repo` or `public_repo` scope."
      : "No write scope on the connected token.",
    nextAction: input.hasWriteScope
      ? "Publishing remains explicit, approval-gated, and audited."
      : "Reconnect GitHub with the `public_repo` scope to publish drafts.",
  });

  checks.push({
    key: "audit_logging",
    name: "AI audit logging",
    status: "present",
    confidence: "high",
    evidence: "Every AI draft and publish attempt is appended to audit_logs.",
  });

  checks.push({
    key: "publish_safety",
    name: "Publish safety guarantees",
    status: "present",
    confidence: "high",
    evidence:
      "Releases are hard-coded `draft: true`, all writes require explicit confirmation, duplicate posts are blocked.",
  });

  if (input.demo) {
    for (const c of checks) {
      c.limitation = (c.limitation ? c.limitation + " " : "") + "Demo mode: values are fixtures.";
    }
  }

  return checks;
}

export function summariseChecks(checks: RepoHealthCheck[]): {
  total: number;
  present: number;
  partial: number;
  missing: number;
  not_verified: number;
} {
  const out = { total: checks.length, present: 0, partial: 0, missing: 0, not_verified: 0 };
  for (const c of checks) {
    out[c.status]++;
  }
  return out;
}
