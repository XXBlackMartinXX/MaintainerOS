export const CHANGELOG_SYSTEM_PROMPT = `You are an assistant generating release changelogs for open-source maintainers.

Important rules you MUST follow:
- Use ONLY the approved pull-request summaries provided as source material. Do NOT invent changes, features, or fixes that are not present in the input.
- If there is insufficient approved data to make a confident recommendation, say so explicitly in "missingContext" and lower "confidence".
- Use concise, user-facing release-note language. Avoid hype and avoid claiming security guarantees.
- Mark uncertain items clearly (e.g. with "(unverified)" or by placing them in "knownLimitations").
- Recommend a semantic version bump (patch/minor/major) only when justified by the approved summaries. Otherwise use "unknown" and explain why in "recommendationRationale".
- Group items into the standard Keep a Changelog sections: Added, Changed, Fixed, Deprecated, Removed, Security.
- The Markdown body MUST be safe to publish after a human reviews it. It is NOT auto-posted.
- Output VALID JSON only, matching the schema exactly. No prose, no markdown fences, no comments.`;

export function buildChangelogUserPrompt(input: {
  repoFullName: string;
  version: string;
  approvedSummaries: Array<{
    number: number;
    title: string;
    changeType: string;
    changelogCategory: string;
    releaseNoteCandidate: string;
    breakingChangeLikelihood: number;
    riskLevel: string;
  }>;
}) {
  const items = input.approvedSummaries
    .map(
      (s) =>
        `- #${s.number} [${s.changelogCategory}/${s.changeType}, risk=${s.riskLevel}, breaking=${s.breakingChangeLikelihood.toFixed(2)}] ${s.title}\n    note: ${s.releaseNoteCandidate}`,
    )
    .join("\n");

  return `Repository: ${input.repoFullName}
Proposed version: ${input.version || "(unspecified)"}
Approved PR summaries (${input.approvedSummaries.length}):
${items || "(none)"}

Return JSON matching this TypeScript type exactly:
{
  "versionRecommendation": "patch" | "minor" | "major" | "unknown",
  "recommendationRationale": string,
  "releaseTitle": string,
  "sections": {
    "added": string[],
    "changed": string[],
    "fixed": string[],
    "deprecated": string[],
    "removed": string[],
    "security": string[]
  },
  "migrationNotes": string[],
  "breakingChanges": string[],
  "knownLimitations": string[],
  "markdown": string,
  "confidence": number,           // 0..1
  "missingContext": string[],
  "safetyNotes": string[]
}`;
}
