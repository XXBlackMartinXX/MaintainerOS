import { describe, it, expect } from "vitest";
import { classifyGithubAppReadiness } from "./github-app-readiness";

const all = (v: boolean) => ({
  githubAppId: v,
  githubAppPrivateKey: v,
  githubAppClientId: v,
  githubAppClientSecret: v,
  githubAppWebhookSecret: v,
});

describe("classifyGithubAppReadiness", () => {
  it("returns not-configured when nothing is set", () => {
    const r = classifyGithubAppReadiness(all(false));
    expect(r.state).toBe("not-configured");
  });

  it("returns partial when only some vars are set, missing id or key", () => {
    const r = classifyGithubAppReadiness({
      ...all(false),
      githubAppClientId: true,
    });
    expect(r.state).toBe("partial");
    if (r.state === "partial") {
      expect(r.missing).toContain("GITHUB_APP_ID");
      expect(r.missing).toContain("GITHUB_APP_PRIVATE_KEY");
    }
  });

  it("returns ready-for-scaffold when id + private key set", () => {
    const r = classifyGithubAppReadiness({
      ...all(false),
      githubAppId: true,
      githubAppPrivateKey: true,
    });
    expect(r.state).toBe("ready-for-scaffold");
    if (r.state === "ready-for-scaffold") {
      expect(r.missing).toContain("GITHUB_APP_WEBHOOK_SECRET");
    }
  });

  it("returns ready-for-scaffold with empty missing when all are set", () => {
    const r = classifyGithubAppReadiness(all(true));
    expect(r.state).toBe("ready-for-scaffold");
    if (r.state === "ready-for-scaffold") {
      expect(r.missing).toEqual([]);
    }
  });
});
