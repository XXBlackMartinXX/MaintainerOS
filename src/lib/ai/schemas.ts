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
