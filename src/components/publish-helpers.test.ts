import { describe, it, expect } from "vitest";
import {
  getPublishEventForSource,
  formatPublishedAt,
  type PublishEvent,
} from "./publish-helpers";

const ev = (over: Partial<PublishEvent>): PublishEvent => ({
  id: "1",
  status: "success",
  target_type: "issue_comment",
  target_id: null,
  github_url: null,
  error_message: null,
  created_at: new Date().toISOString(),
  ...over,
});

describe("getPublishEventForSource", () => {
  it("returns null for missing or empty events", () => {
    expect(getPublishEventForSource(undefined)).toBeNull();
    expect(getPublishEventForSource([])).toBeNull();
  });

  it("returns the first matching status", () => {
    const a = ev({ id: "a", status: "failed" });
    const b = ev({ id: "b", status: "success" });
    expect(getPublishEventForSource([a, b], "success")?.id).toBe("b");
    expect(getPublishEventForSource([a, b], "failed")?.id).toBe("a");
  });

  it("returns null when no event matches the requested status", () => {
    expect(getPublishEventForSource([ev({ status: "failed" })], "success")).toBeNull();
  });
});

describe("formatPublishedAt", () => {
  it("returns a human-readable relative time", () => {
    const out = formatPublishedAt(new Date(Date.now() - 60_000).toISOString());
    expect(out).toMatch(/ago/);
  });

  it("falls back to the raw string for invalid input", () => {
    expect(formatPublishedAt("not-a-date")).toBe("not-a-date");
  });
});
