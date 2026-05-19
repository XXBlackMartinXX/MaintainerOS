export const DOC_TYPES = [
  "readme_suggestions",
  "contributing",
  "security",
  "code_of_conduct",
  "issue_template",
  "pull_request_template",
  "maintainer_guide",
  "release_process",
  "contributor_onboarding",
] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const DOC_TYPE_LABELS: Record<DocType, { title: string; purpose: string; filename: string }> = {
  readme_suggestions:    { title: "README improvement suggestions", purpose: "Concrete improvements for the existing README.",            filename: "README-suggestions.md" },
  contributing:          { title: "CONTRIBUTING.md",                purpose: "How new contributors get started and what good PRs look like.", filename: "CONTRIBUTING.md" },
  security:              { title: "SECURITY.md",                    purpose: "How to responsibly disclose security issues.",                  filename: "SECURITY.md" },
  code_of_conduct:       { title: "CODE_OF_CONDUCT.md",             purpose: "Welcoming, inclusive community guidelines.",                    filename: "CODE_OF_CONDUCT.md" },
  issue_template:        { title: "GitHub issue template",          purpose: "Structured issue form for bug reports / feature requests.",     filename: ".github/ISSUE_TEMPLATE/bug_report.md" },
  pull_request_template: { title: "GitHub pull request template",   purpose: "Checklist that helps maintainers review PRs faster.",           filename: ".github/PULL_REQUEST_TEMPLATE.md" },
  maintainer_guide:      { title: "Maintainer guide",               purpose: "How this project is maintained day-to-day.",                    filename: "MAINTAINING.md" },
  release_process:       { title: "Release process guide",          purpose: "Versioning, changelog, and release steps.",                     filename: "RELEASING.md" },
  contributor_onboarding:{ title: "New contributor onboarding",     purpose: "First-week guide for a brand-new contributor.",                 filename: "ONBOARDING.md" },
};

export const DOCS_SYSTEM_PROMPT = `You are an assistant helping open-source maintainers draft project documentation.

You MUST follow these rules:
- Generate an EDITABLE DRAFT for a human maintainer. It is NOT posted anywhere automatically.
- Use ONLY the repository metadata, synced issue/PR summaries, and existing signals provided in the user message.
- Do NOT invent project claims (features, sponsors, awards, compliance, certifications, license, security guarantees).
- When information is unknown or thin, write \`TODO: <what's missing>\` inline AND add an entry to "missingContext". Lower "confidence" accordingly.
- Use welcoming, inclusive, neutral language. Avoid judgmental language about contributors.
- AVOID legal guarantees ("we guarantee", "we warrant", "always secure", "fully compliant"). Prefer "best effort", "we aim to", "recommended".
- For security-related docs: encourage responsible disclosure via private channels, do not promise SLAs unless provided, and never claim the project is secure or invulnerable.
- The Markdown body must be self-contained, valid CommonMark, suitable to drop into a repo file as a starting point.
- Output VALID JSON only matching the provided schema. No prose, no markdown fences around the JSON, no comments.`;

export type DocsPromptInput = {
  docType: DocType;
  repoFullName: string;
  description: string | null;
  primaryLanguage: string | null;
  defaultBranch: string | null;
  visibility: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  contributorCount: number;
  recentReleaseTitles: string[];
  topLabels: string[];
  approvedPrSummaryHighlights: string[];
  hasSecurityMd: boolean | null;
  hasContributingMd: boolean | null;
  hasCodeOfConduct: boolean | null;
};

export function buildDocsUserPrompt(input: DocsPromptInput): string {
  const meta = DOC_TYPE_LABELS[input.docType];
  const lines: string[] = [];
  lines.push(`Generate: ${meta.title}`);
  lines.push(`Purpose: ${meta.purpose}`);
  lines.push(`Suggested filename: ${meta.filename}`);
  lines.push("");
  lines.push("Repository signals (use only what's here; mark unknowns as TODO):");
  lines.push(`- full_name: ${input.repoFullName}`);
  lines.push(`- description: ${input.description ?? "unknown"}`);
  lines.push(`- primary_language: ${input.primaryLanguage ?? "unknown"}`);
  lines.push(`- default_branch: ${input.defaultBranch ?? "unknown"}`);
  lines.push(`- visibility: ${input.visibility ?? "unknown"}`);
  lines.push(`- stars: ${input.stars}, forks: ${input.forks}, open_issues: ${input.openIssues}`);
  lines.push(`- contributor_count_synced: ${input.contributorCount}`);
  lines.push(`- recent_release_titles: ${input.recentReleaseTitles.length ? input.recentReleaseTitles.slice(0, 5).join(" | ") : "unknown"}`);
  lines.push(`- top_labels: ${input.topLabels.length ? input.topLabels.slice(0, 12).join(", ") : "unknown"}`);
  lines.push(`- has_SECURITY_md: ${input.hasSecurityMd === null ? "unknown" : String(input.hasSecurityMd)}`);
  lines.push(`- has_CONTRIBUTING_md: ${input.hasContributingMd === null ? "unknown" : String(input.hasContributingMd)}`);
  lines.push(`- has_CODE_OF_CONDUCT: ${input.hasCodeOfConduct === null ? "unknown" : String(input.hasCodeOfConduct)}`);
  if (input.approvedPrSummaryHighlights.length) {
    lines.push("- approved_pr_summary_highlights:");
    for (const h of input.approvedPrSummaryHighlights.slice(0, 10)) {
      lines.push(`  • ${h}`);
    }
  }
  lines.push("");
  lines.push(`Return JSON with this exact shape:
{
  "title": string,
  "purpose": string,
  "bodyMarkdown": string,                 // the editable draft (CommonMark, can contain TODOs)
  "confidence": number between 0 and 1,
  "missingContext": string[],             // what's needed to make this draft better
  "safetyNotes": string[],                // cautions, e.g. "Do not commit until license is confirmed"
  "sourceDataSummary": string             // one short paragraph describing which inputs were used
}`);
  return lines.join("\n");
}
