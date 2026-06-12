import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Static text checks that pin the user-facing reliability copy in place.
 * These do NOT render React — they read the source file and assert that
 * the critical strings users rely on are still there. If a future edit
 * rewords one of these, the test fails and the author has to update the
 * test on purpose. This is intentionally cheap and stable in CI.
 */
function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("user-facing reliability copy", () => {
  it("login page surfaces backend-missing guidance without leaking secret names", () => {
    const src = read("src/routes/login.tsx");
    expect(src).toMatch(/Backend setup required/);
    expect(src).toMatch(/Try the demo|\/demo/);
    expect(src).toMatch(/setup diagnostics/i);
    // Must not hard-code real secret values in the page.
    expect(src).not.toMatch(/eyJhbGciOi[A-Za-z0-9._-]+/);
  });

  it("demo banner makes it explicit that data is sample and publishing is disabled", () => {
    const src = read("src/components/demo-banner.tsx");
    expect(src).toMatch(/Demo mode active/);
    expect(src).toMatch(/sample data/i);
    expect(src).toMatch(/Publishing and GitHub sync are disabled/);
    expect(src).toMatch(/Exit demo/);
  });

  it("publish confirmation dialog warns before each kind of GitHub write", () => {
    const src = read("src/components/publish-confirm-dialog.tsx");
    // Every kind has a destructive warning copy entry.
    for (const kind of ["issue_comment", "issue_labels", "pr_comment", "release_draft"]) {
      expect(src).toContain(kind);
    }
    expect(src).toMatch(/public GitHub comment under your account/);
    expect(src).toMatch(/draft release/i);
    // Re-post flow is supported.
    expect(src).toMatch(/Post again/);
  });
});
