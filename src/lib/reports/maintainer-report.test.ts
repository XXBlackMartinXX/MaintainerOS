import { describe, it, expect } from "vitest";
import { generateMaintainerReport } from "./maintainer-report";
import type { RepoHealthCheck } from "../repo-health/types";

const sampleCheck: RepoHealthCheck = {
  key: "readme",
  name: "README",
  status: "missing",
  confidence: "low",
  evidence: "No AI draft generated yet.",
  nextAction: "Generate README suggestions in Documentation.",
};

const fixedDate = new Date("2026-06-11T12:00:00Z");

describe("generateMaintainerReport", () => {
  it("includes repo name, mode, and advisory disclaimer", () => {
    const md = generateMaintainerReport({
      repoFullName: "acme/atlas",
      generatedAt: fixedDate,
      mode: "demo",
      checks: [sampleCheck],
      pendingItems: [],
      recentAudit: [],
      knownLimitations: ["No live OAuth E2E test."],
    });
    expect(md).toContain("# Maintainer report — acme/atlas");
    expect(md).toContain("demo data");
    expect(md).toContain("Advisory report");
    expect(md).toContain("not a substitute for a formal audit");
  });

  it("never includes secret-like markers (tokens, keys)", () => {
    const md = generateMaintainerReport({
      repoFullName: "acme/atlas",
      generatedAt: fixedDate,
      mode: "live",
      checks: [sampleCheck],
      pendingItems: [],
      recentAudit: [{ action: "ai.docs.generated", createdAt: "2026-06-11T11:00:00Z" }],
      knownLimitations: [],
    });
    expect(md).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|LOVABLE_API_KEY|Bearer [A-Za-z0-9]/);
  });

  it("renders the recommended-actions section from missing/partial checks", () => {
    const md = generateMaintainerReport({
      repoFullName: "acme/atlas",
      generatedAt: fixedDate,
      mode: "live",
      checks: [sampleCheck],
      pendingItems: [],
      recentAudit: [],
      knownLimitations: [],
    });
    expect(md).toContain("Recommended next actions");
    expect(md).toContain("Generate README suggestions in Documentation.");
  });

  it("renders status icons in the checks table", () => {
    const md = generateMaintainerReport({
      repoFullName: "acme/atlas",
      generatedAt: fixedDate,
      mode: "live",
      checks: [sampleCheck, { ...sampleCheck, key: "x", name: "Audit logging", status: "present" }],
      pendingItems: [],
      recentAudit: [],
      knownLimitations: [],
    });
    expect(md).toMatch(/✗ missing/);
    expect(md).toMatch(/✓ present/);
  });

  it("escapes control characters in dynamic fields", () => {
    const md = generateMaintainerReport({
      repoFullName: "acme/at\u0001las",
      generatedAt: fixedDate,
      mode: "live",
      checks: [],
      pendingItems: [
        {
          id: "x",
          source: "documentation",
          title: "title with\u0007bell",
          approvalStatus: "pending",
          updatedAt: "2026-06-01T00:00:00Z",
        },
      ],
      recentAudit: [],
      knownLimitations: [],
    });
    // eslint-disable-next-line no-control-regex
    expect(md).not.toMatch(/[\u0000-\u0008\u000b-\u001f\u007f]/);
  });
});
