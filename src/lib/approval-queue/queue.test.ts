import { describe, it, expect } from "vitest";
import {
  countsByStatus,
  filterQueue,
  groupBySource,
  isActionable,
  normaliseApprovalStatus,
  sortQueue,
  type QueueItem,
} from "./queue";

const item = (partial: Partial<QueueItem>): QueueItem => ({
  id: partial.id ?? "id",
  source: partial.source ?? "issue_triage",
  title: partial.title ?? "Untitled",
  approvalStatus: partial.approvalStatus ?? "pending",
  updatedAt: partial.updatedAt ?? "2026-06-01T00:00:00Z",
  ...partial,
});

describe("normaliseApprovalStatus", () => {
  it("defaults unknown / null to pending", () => {
    expect(normaliseApprovalStatus(null)).toBe("pending");
    expect(normaliseApprovalStatus(undefined)).toBe("pending");
    expect(normaliseApprovalStatus("")).toBe("pending");
    expect(normaliseApprovalStatus("weird")).toBe("pending");
  });
  it("preserves known states", () => {
    expect(normaliseApprovalStatus("approved")).toBe("approved");
    expect(normaliseApprovalStatus("rejected")).toBe("rejected");
  });
});

describe("filterQueue", () => {
  const items = [
    item({ id: "a", source: "issue_triage", title: "Memory leak", approvalStatus: "pending" }),
    item({ id: "b", source: "pr_summary", title: "Refactor auth", approvalStatus: "approved" }),
    item({ id: "c", source: "release_draft", title: "v1.0", approvalStatus: "edited" }),
  ];
  it("filters by source", () => {
    expect(filterQueue(items, { source: "pr_summary" }).map((i) => i.id)).toEqual(["b"]);
  });
  it("filters by status", () => {
    expect(filterQueue(items, { status: "edited" }).map((i) => i.id)).toEqual(["c"]);
  });
  it("filters by case-insensitive search", () => {
    expect(filterQueue(items, { search: "MEMORY" }).map((i) => i.id)).toEqual(["a"]);
  });
  it("treats 'all' as no filter", () => {
    expect(filterQueue(items, { source: "all", status: "all" })).toHaveLength(3);
  });
});

describe("sortQueue", () => {
  it("puts edited and approved before pending", () => {
    const items = [
      item({ id: "a", approvalStatus: "pending" }),
      item({ id: "b", approvalStatus: "edited" }),
      item({ id: "c", approvalStatus: "approved" }),
    ];
    expect(sortQueue(items).map((i) => i.id)).toEqual(["b", "c", "a"]);
  });
  it("puts published last", () => {
    const items = [
      item({ id: "a", approvalStatus: "published" }),
      item({ id: "b", approvalStatus: "pending" }),
    ];
    expect(sortQueue(items)[sortQueue(items).length - 1].id).toBe("a");
  });
});

describe("groupBySource & countsByStatus", () => {
  const items = [
    item({ source: "issue_triage", approvalStatus: "pending" }),
    item({ source: "issue_triage", approvalStatus: "approved" }),
    item({ source: "pr_summary", approvalStatus: "pending" }),
  ];
  it("groups by source", () => {
    const g = groupBySource(items);
    expect(g.issue_triage).toHaveLength(2);
    expect(g.pr_summary).toHaveLength(1);
    expect(g.documentation).toHaveLength(0);
  });
  it("counts by status", () => {
    expect(countsByStatus(items)).toMatchObject({ pending: 2, approved: 1 });
  });
});

describe("isActionable", () => {
  it("is true for pending or edited", () => {
    expect(isActionable(item({ approvalStatus: "pending" }))).toBe(true);
    expect(isActionable(item({ approvalStatus: "edited" }))).toBe(true);
  });
  it("is false otherwise", () => {
    expect(isActionable(item({ approvalStatus: "approved" }))).toBe(false);
    expect(isActionable(item({ approvalStatus: "published" }))).toBe(false);
  });
});
