/**
 * AI draft explainability helpers.
 *
 * Pure, framework-free utilities used by the UI to render a consistent
 * "why this draft was suggested / what to verify" panel next to any AI
 * output. We deliberately keep this advisory and never claim the draft is
 * correct, safe to publish, or production-ready.
 */

export type DraftKind =
  | "issue_triage"
  | "pr_summary"
  | "release_draft"
  | "documentation";

export type Explainability = {
  /** Short one-line label always shown next to the draft. */
  label: string;
  /** Why MaintainerOS produced this draft. */
  rationale: string;
  /** What input the model was given (high-level, no secrets). */
  inputsUsed: string[];
  /** Manual verification reminders before approving or publishing. */
  verificationChecklist: string[];
  /** A risk band derived from confidence (when available). */
  riskBand: "low" | "medium" | "high" | "unknown";
};

const LABEL = "AI draft — review before publishing";

const BASE_INPUTS: Record<DraftKind, string[]> = {
  issue_triage: ["Issue title", "Issue body", "Existing labels (when synced)"],
  pr_summary: ["PR title", "PR description", "Changed file list (when synced)"],
  release_draft: ["Merged pull requests in the window", "Existing changelog (when present)"],
  documentation: ["Repository metadata", "Existing documentation drafts"],
};

const BASE_RATIONALE: Record<DraftKind, string> = {
  issue_triage:
    "Suggests labels, priority, and a triage note based on the issue text. Heuristic — not a substitute for maintainer judgement.",
  pr_summary:
    "Summarises the PR and proposes a release-note line based on title, description, and changed files.",
  release_draft:
    "Aggregates recent merged PRs into a draft changelog. Published only as a GitHub draft release after explicit approval.",
  documentation:
    "Generates a starting point for the requested document type. The draft is never committed automatically.",
};

const BASE_CHECKLIST: Record<DraftKind, string[]> = {
  issue_triage: [
    "Confirm the suggested labels exist in the repository.",
    "Verify priority reflects current project realities.",
    "Edit the triage note before posting if anything is inaccurate.",
  ],
  pr_summary: [
    "Confirm the summary matches what the PR actually changes.",
    "Edit the release-note candidate to remove speculation.",
    "Check for any sensitive details the model may have included.",
  ],
  release_draft: [
    "Confirm every line maps to a real merged PR in the window.",
    "Remove or rewrite any line you cannot personally verify.",
    "Releases are created as drafts — review on GitHub before publishing.",
  ],
  documentation: [
    "Treat the draft as a starting point, not finished documentation.",
    "Verify all factual claims (commands, file paths, links).",
    "Commit the file to the repository yourself — MaintainerOS does not push files.",
  ],
};

export function riskBandFromConfidence(
  confidence: number | null | undefined,
): Explainability["riskBand"] {
  if (typeof confidence !== "number" || Number.isNaN(confidence)) return "unknown";
  if (confidence >= 0.75) return "low";
  if (confidence >= 0.5) return "medium";
  return "high";
}

export function buildExplainability(
  kind: DraftKind,
  options: { confidence?: number | null; model?: string | null } = {},
): Explainability {
  const inputs = [...BASE_INPUTS[kind]];
  if (options.model) inputs.push(`Model: ${options.model}`);
  return {
    label: LABEL,
    rationale: BASE_RATIONALE[kind],
    inputsUsed: inputs,
    verificationChecklist: BASE_CHECKLIST[kind],
    riskBand: riskBandFromConfidence(options.confidence ?? null),
  };
}
