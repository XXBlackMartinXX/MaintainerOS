import { describe, it, expect } from "vitest";
import { buildRepoHealthChecks, classifyDraftStatus, summariseChecks } from "./checks";

describe("classifyDraftStatus", () => {
  it("returns missing when no draft exists", () => {
    expect(classifyDraftStatus(undefined)).toBe("missing");
  });
  it("returns partial for any draft state (we cannot read repo files yet)", () => {
    expect(classifyDraftStatus("pending")).toBe("partial");
    expect(classifyDraftStatus("approved")).toBe("partial");
    expect(classifyDraftStatus("edited")).toBe("partial");
  });
});

describe("buildRepoHealthChecks", () => {
  const base = {
    draftStatusByType: {},
    syncFreshDays: null,
    hasWriteScope: false,
    demo: false,
  };

  it("marks every draft check missing when no drafts exist", () => {
    const checks = buildRepoHealthChecks(base);
    const docChecks = checks.filter((c) =>
      ["readme", "contributing", "security_md", "code_of_conduct"].includes(c.key),
    );
    expect(docChecks.every((c) => c.status === "missing")).toBe(true);
  });

  it("flags missing write scope and missing sync when not configured", () => {
    const checks = buildRepoHealthChecks(base);
    expect(checks.find((c) => c.key === "write_scope")?.status).toBe("missing");
    expect(checks.find((c) => c.key === "sync_freshness")?.status).toBe("missing");
  });

  it("classifies sync freshness against the day threshold", () => {
    expect(
      buildRepoHealthChecks({ ...base, syncFreshDays: 0 }).find((c) => c.key === "sync_freshness")
        ?.status,
    ).toBe("present");
    expect(
      buildRepoHealthChecks({ ...base, syncFreshDays: 5 }).find((c) => c.key === "sync_freshness")
        ?.status,
    ).toBe("partial");
    expect(
      buildRepoHealthChecks({ ...base, syncFreshDays: 30 }).find((c) => c.key === "sync_freshness")
        ?.status,
    ).toBe("missing");
  });

  it("treats every draft state as partial, never present", () => {
    const checks = buildRepoHealthChecks({
      ...base,
      draftStatusByType: { security: "approved", readme_suggestions: "edited" },
    });
    expect(checks.find((c) => c.key === "security_md")?.status).toBe("partial");
    expect(checks.find((c) => c.key === "readme")?.status).toBe("partial");
  });

  it("decorates limitations when demo mode is on", () => {
    const checks = buildRepoHealthChecks({ ...base, demo: true });
    expect(checks.every((c) => c.limitation?.includes("Demo mode"))).toBe(true);
  });

  it("summariseChecks counts by status", () => {
    const checks = buildRepoHealthChecks({
      ...base,
      syncFreshDays: 0,
      hasWriteScope: true,
      draftStatusByType: { security: "approved" },
    });
    const sum = summariseChecks(checks);
    expect(sum.total).toBe(checks.length);
    expect(sum.present + sum.partial + sum.missing + sum.not_verified).toBe(sum.total);
    expect(sum.present).toBeGreaterThan(0);
  });
});
