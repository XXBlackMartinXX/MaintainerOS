export const PR_SUMMARY_SYSTEM_PROMPT = `You are an assistant helping open-source maintainers review pull requests.

Important rules you MUST follow:
- You assist maintainers reviewing pull requests. You are NOT a replacement for human code review.
- You MUST NOT claim a PR is safe, correct, secure, or mergeable unless there is direct evidence in the provided data.
- You MUST identify missing context. If the diff or description is unavailable or thin, include explicit entries in "missingContext" and lower "confidence".
- You MUST avoid personal judgement about contributors. Use neutral, respectful language.
- Clearly separate observed facts from suggested review focus. Suggested review focus must be phrased as questions or things to verify, not assertions.
- For anything that could affect security, data integrity, or production behavior, prefer cautious "review recommended" wording over certainty.
- Your output is an EDITABLE DRAFT for a human maintainer. It is not posted anywhere automatically.
- Output VALID JSON only, matching the provided schema exactly. No prose, no markdown fences, no comments.`;

export function buildPrSummaryUserPrompt(input: {
  repoFullName: string;
  number: number;
  title: string;
  body: string | null;
  author: string | null;
  state: string;
  draft: boolean;
  additions: number;
  deletions: number;
  changedFiles: number;
  merged: boolean;
}) {
  return `Repository: ${input.repoFullName}
Pull request #${input.number} (state: ${input.state}${input.merged ? ", merged" : ""}${input.draft ? ", draft" : ""})
Author: ${input.author ?? "unknown"}
Diff size: +${input.additions} / -${input.deletions} across ${input.changedFiles} files

Title:
${input.title}

Description:
${(input.body ?? "").slice(0, 8000) || "(empty)"}

NOTE: Full file diff is not provided. Treat code-level claims with caution and list anything you cannot verify in "missingContext".

Return JSON matching this TypeScript type exactly:
{
  "plainEnglishSummary": string,
  "technicalSummary": string,
  "changeType": "feature" | "fix" | "docs" | "refactor" | "test" | "chore" | "security" | "dependency" | "unknown",
  "riskLevel": "low" | "medium" | "high" | "unknown",
  "confidence": number,                    // 0..1
  "breakingChangeLikelihood": number,      // 0..1
  "suggestedReviewFocus": string[],
  "testingNotes": string[],
  "securityNotes": string[],
  "releaseNoteCandidate": string,          // 1 line, user-facing
  "changelogCategory": "Added" | "Changed" | "Fixed" | "Deprecated" | "Removed" | "Security" | "Unknown",
  "suggestedLabels": string[],
  "mergeReadinessNotes": string[],
  "missingContext": string[],
  "safetyNotes": string[]
}`;
}
