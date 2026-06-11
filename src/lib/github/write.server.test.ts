import { describe, it, expect } from "vitest";
import { parseScopes, evaluateWritePermissions } from "./write.server";

describe("parseScopes", () => {
  it("returns [] for null/undefined/empty input", () => {
    expect(parseScopes(null)).toEqual([]);
    expect(parseScopes(undefined)).toEqual([]);
    expect(parseScopes("")).toEqual([]);
  });

  it("splits on whitespace and commas", () => {
    expect(parseScopes("repo read:user")).toEqual(["repo", "read:user"]);
    expect(parseScopes("repo,public_repo")).toEqual(["repo", "public_repo"]);
    expect(parseScopes("  repo , read:user  ")).toEqual(["repo", "read:user"]);
  });
});

describe("evaluateWritePermissions", () => {
  it("denies all writes without a token", () => {
    const p = evaluateWritePermissions([], false);
    expect(p.hasToken).toBe(false);
    expect(p.canCommentIssues).toBe(false);
    expect(p.canManageLabels).toBe(false);
    expect(p.canCommentPulls).toBe(false);
    expect(p.canCreateReleases).toBe(false);
  });

  it("denies all writes when token present but only read scopes", () => {
    const p = evaluateWritePermissions(["read:user", "user:email"], true);
    expect(p.canCommentIssues).toBe(false);
    expect(p.canCreateReleases).toBe(false);
  });

  it("grants writes only when 'repo' or 'public_repo' scope is present", () => {
    const a = evaluateWritePermissions(["repo"], true);
    expect(a.canCommentIssues).toBe(true);
    expect(a.canCreateReleases).toBe(true);

    const b = evaluateWritePermissions(["public_repo"], true);
    expect(b.canCommentIssues).toBe(true);
    expect(b.canCreateReleases).toBe(true);
  });
});
