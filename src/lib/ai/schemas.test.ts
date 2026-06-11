import { describe, it, expect } from "vitest";
import {
  triageResultSchema,
  prSummarySchema,
  changelogResultSchema,
  documentationResultSchema,
} from "./schemas";

describe("triageResultSchema", () => {
  it("accepts a minimal valid draft", () => {
    const r = triageResultSchema.parse({
      issueType: "bug",
      severity: "low",
      priority: "P2",
      complexity: "small",
      confidence: 0.5,
      duplicateLikelihood: 0.1,
      sentiment: "neutral",
      maintainerActionNeeded: true,
      recommendedNextAction: "Reproduce locally.",
      suggestedMaintainerReply: "Thanks for the report.",
    });
    expect(r.issueType).toBe("bug");
    expect(r.suggestedLabels).toEqual([]);
  });

  it("rejects unknown enum values", () => {
    expect(() =>
      triageResultSchema.parse({
        issueType: "not-a-type",
        severity: "low",
        priority: "P2",
        complexity: "small",
        confidence: 0.5,
        duplicateLikelihood: 0.1,
        sentiment: "neutral",
        maintainerActionNeeded: false,
        recommendedNextAction: "",
        suggestedMaintainerReply: "",
      }),
    ).toThrow();
  });

  it("rejects confidence > 1", () => {
    expect(() =>
      triageResultSchema.parse({
        issueType: "bug",
        severity: "low",
        priority: "P2",
        complexity: "small",
        confidence: 1.5,
        duplicateLikelihood: 0.1,
        sentiment: "neutral",
        maintainerActionNeeded: false,
        recommendedNextAction: "",
        suggestedMaintainerReply: "",
      }),
    ).toThrow();
  });
});

describe("prSummarySchema", () => {
  it("requires plainEnglishSummary and bounded confidence", () => {
    const r = prSummarySchema.parse({
      plainEnglishSummary: "Fixes a typo.",
      technicalSummary: "One-character change.",
      changeType: "fix",
      riskLevel: "low",
      confidence: 0.9,
      breakingChangeLikelihood: 0,
      releaseNoteCandidate: "Fix typo",
      changelogCategory: "Fixed",
    });
    expect(r.suggestedReviewFocus).toEqual([]);
  });
});

describe("changelogResultSchema", () => {
  it("parses a structured changelog draft", () => {
    const r = changelogResultSchema.parse({
      versionRecommendation: "patch",
      recommendationRationale: "Bugfixes only.",
      releaseTitle: "v0.1.1",
      sections: {
        added: [],
        changed: [],
        fixed: ["Fix bug"],
        deprecated: [],
        removed: [],
        security: [],
      },
      markdown: "## Fixed\n- Fix bug",
      confidence: 0.7,
    });
    expect(r.sections.fixed).toContain("Fix bug");
  });
});

describe("documentationResultSchema", () => {
  it("requires non-empty title and body", () => {
    expect(() =>
      documentationResultSchema.parse({
        title: "",
        bodyMarkdown: "",
        confidence: 0.5,
      }),
    ).toThrow();
  });
});
