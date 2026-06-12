import { describe, it, expect } from "vitest";
import { buildExplainability, riskBandFromConfidence } from "./explainability";

describe("riskBandFromConfidence", () => {
  it("maps confidence to risk bands", () => {
    expect(riskBandFromConfidence(0.9)).toBe("low");
    expect(riskBandFromConfidence(0.6)).toBe("medium");
    expect(riskBandFromConfidence(0.1)).toBe("high");
    expect(riskBandFromConfidence(null)).toBe("unknown");
    expect(riskBandFromConfidence(undefined)).toBe("unknown");
    expect(riskBandFromConfidence(Number.NaN)).toBe("unknown");
  });
});

describe("buildExplainability", () => {
  it("always uses the 'review before publishing' label", () => {
    const e = buildExplainability("issue_triage");
    expect(e.label).toContain("review before publishing");
  });

  it("includes rationale, inputs, and a verification checklist for each kind", () => {
    for (const kind of [
      "issue_triage",
      "pr_summary",
      "release_draft",
      "documentation",
    ] as const) {
      const e = buildExplainability(kind);
      expect(e.rationale.length).toBeGreaterThan(0);
      expect(e.inputsUsed.length).toBeGreaterThan(0);
      expect(e.verificationChecklist.length).toBeGreaterThan(0);
    }
  });

  it("appends the model to inputs when provided", () => {
    const e = buildExplainability("documentation", { model: "lovable/test-model" });
    expect(e.inputsUsed.some((i) => i.includes("lovable/test-model"))).toBe(true);
  });

  it("does not contain forbidden overclaiming language", () => {
    const e = buildExplainability("release_draft", { confidence: 0.9 });
    const blob = [e.label, e.rationale, ...e.inputsUsed, ...e.verificationChecklist]
      .join(" ")
      .toLowerCase();
    for (const banned of ["production-ready", "guaranteed", "certified", "soc 2"]) {
      expect(blob).not.toContain(banned);
    }
  });
});
