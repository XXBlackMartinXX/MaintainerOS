import { z } from "zod";

export const issueTypes = ["bug","feature","docs","security","question","maintenance","duplicate","spam","unknown"] as const;
export const severities = ["low","medium","high","critical","unknown"] as const;
export const priorities = ["P0","P1","P2","P3","unknown"] as const;
export const complexities = ["small","medium","large","unknown"] as const;
export const sentiments = ["positive","neutral","frustrated","hostile","unknown"] as const;
export const approvalStatuses = ["pending","approved","edited","rejected"] as const;

export const triageResultSchema = z.object({
  issueType: z.enum(issueTypes),
  severity: z.enum(severities),
  priority: z.enum(priorities),
  complexity: z.enum(complexities),
  confidence: z.number().min(0).max(1),
  suggestedLabels: z.array(z.string().max(80)).max(20).default([]),
  duplicateLikelihood: z.number().min(0).max(1),
  sentiment: z.enum(sentiments),
  maintainerActionNeeded: z.boolean(),
  recommendedNextAction: z.string().max(500),
  suggestedMaintainerReply: z.string().max(4000),
  summary: z.string().max(1000).default(""),
  riskNotes: z.array(z.string().max(300)).max(20).default([]),
  safetyNotes: z.array(z.string().max(300)).max(20).default([]),
});

export type TriageResult = z.infer<typeof triageResultSchema>;

// ---- PR summary ----
export const changeTypes = ["feature","fix","docs","refactor","test","chore","security","dependency","unknown"] as const;
export const riskLevels = ["low","medium","high","unknown"] as const;
export const changelogCategories = ["Added","Changed","Fixed","Deprecated","Removed","Security","Unknown"] as const;
export const versionBumps = ["patch","minor","major","unknown"] as const;

export const prSummarySchema = z.object({
  plainEnglishSummary: z.string().max(2000),
  technicalSummary: z.string().max(4000),
  changeType: z.enum(changeTypes),
  riskLevel: z.enum(riskLevels),
  confidence: z.number().min(0).max(1),
  breakingChangeLikelihood: z.number().min(0).max(1),
  suggestedReviewFocus: z.array(z.string().max(300)).max(20).default([]),
  testingNotes: z.array(z.string().max(300)).max(20).default([]),
  securityNotes: z.array(z.string().max(300)).max(20).default([]),
  releaseNoteCandidate: z.string().max(500),
  changelogCategory: z.enum(changelogCategories),
  suggestedLabels: z.array(z.string().max(80)).max(20).default([]),
  mergeReadinessNotes: z.array(z.string().max(300)).max(20).default([]),
  missingContext: z.array(z.string().max(300)).max(20).default([]),
  safetyNotes: z.array(z.string().max(300)).max(20).default([]),
});
export type PrSummaryResult = z.infer<typeof prSummarySchema>;

// ---- Changelog ----
export const changelogResultSchema = z.object({
  versionRecommendation: z.enum(versionBumps),
  recommendationRationale: z.string().max(1000),
  releaseTitle: z.string().max(200),
  sections: z.object({
    added: z.array(z.string().max(500)).max(100).default([]),
    changed: z.array(z.string().max(500)).max(100).default([]),
    fixed: z.array(z.string().max(500)).max(100).default([]),
    deprecated: z.array(z.string().max(500)).max(100).default([]),
    removed: z.array(z.string().max(500)).max(100).default([]),
    security: z.array(z.string().max(500)).max(100).default([]),
  }),
  migrationNotes: z.array(z.string().max(500)).max(50).default([]),
  breakingChanges: z.array(z.string().max(500)).max(50).default([]),
  knownLimitations: z.array(z.string().max(500)).max(50).default([]),
  markdown: z.string().max(20000),
  confidence: z.number().min(0).max(1),
  missingContext: z.array(z.string().max(300)).max(20).default([]),
  safetyNotes: z.array(z.string().max(300)).max(20).default([]),
});
export type ChangelogResult = z.infer<typeof changelogResultSchema>;

export const releaseDraftStatuses = ["draft","approved","rejected","copied"] as const;

// ---- Documentation generator ----
export const documentationResultSchema = z.object({
  title: z.string().min(1).max(200),
  purpose: z.string().max(500).default(""),
  bodyMarkdown: z.string().min(1).max(40000),
  confidence: z.number().min(0).max(1),
  missingContext: z.array(z.string().max(300)).max(30).default([]),
  safetyNotes: z.array(z.string().max(300)).max(30).default([]),
  sourceDataSummary: z.string().max(1000).default(""),
});
export type DocumentationResult = z.infer<typeof documentationResultSchema>;
