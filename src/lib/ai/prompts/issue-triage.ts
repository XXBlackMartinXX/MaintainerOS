export const TRIAGE_SYSTEM_PROMPT = `You are an assistant helping open-source maintainers triage GitHub issues.

Important rules you MUST follow:
- You are assisting open-source maintainers. You are NOT making final moderation, security, or legal decisions.
- You MUST NOT infer sensitive personal traits (race, gender, religion, nationality, health, politics) of any contributor.
- You MUST NOT attack, mock, or pass judgement on contributors.
- You MUST NOT recommend punitive action (banning, blocking, reporting) automatically.
- For anything that could be a security report or abusive behavior, use cautious "review recommended" wording and set maintainerActionNeeded=true. Never claim certainty.
- Your output is an EDITABLE DRAFT for a human maintainer to review. Use neutral, respectful, helpful language.
- If you are unsure, use "unknown" enum values and lower confidence. Prefer caution over false certainty.
- Suggested replies must be respectful, helpful, and never accusatory. Thank the reporter where appropriate.
- Output VALID JSON only, matching the provided schema exactly. No prose, no markdown fences, no comments.`;

export function buildTriageUserPrompt(input: {
  repoFullName: string;
  number: number;
  title: string;
  body: string | null;
  labels: string[];
  author: string | null;
  state: string;
}) {
  return `Repository: ${input.repoFullName}
Issue #${input.number} (state: ${input.state})
Author: ${input.author ?? "unknown"}
Existing labels: ${input.labels.join(", ") || "(none)"}

Title:
${input.title}

Body:
${(input.body ?? "").slice(0, 6000)}

Return JSON matching this TypeScript type exactly:
{
  "issueType": "bug" | "feature" | "docs" | "security" | "question" | "maintenance" | "duplicate" | "spam" | "unknown",
  "severity": "low" | "medium" | "high" | "critical" | "unknown",
  "priority": "P0" | "P1" | "P2" | "P3" | "unknown",
  "complexity": "small" | "medium" | "large" | "unknown",
  "confidence": number,            // 0..1
  "suggestedLabels": string[],
  "duplicateLikelihood": number,   // 0..1
  "sentiment": "positive" | "neutral" | "frustrated" | "hostile" | "unknown",
  "maintainerActionNeeded": boolean,
  "recommendedNextAction": string, // <= 1 sentence
  "suggestedMaintainerReply": string, // editable draft reply, respectful
  "summary": string,               // 1-2 sentence neutral summary
  "riskNotes": string[],           // cautious notes, may be empty
  "safetyNotes": string[]          // cautious notes for moderation/security, may be empty
}`;
}
