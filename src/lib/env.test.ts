import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { serverEnv, hasFeature, requireFeature } from "./env";

const KEYS = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_WEBHOOK_SECRET",
  "LOVABLE_API_KEY",
] as const;

describe("serverEnv / hasFeature", () => {
  const original: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of KEYS) {
      original[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of KEYS) {
      if (original[k] === undefined) delete process.env[k];
      else process.env[k] = original[k];
    }
  });

  it("reports all features missing when nothing is set", () => {
    expect(hasFeature("supabase")).toBe(false);
    expect(hasFeature("supabase-admin")).toBe(false);
    expect(hasFeature("github-oauth")).toBe(false);
    expect(hasFeature("ai-gateway")).toBe(false);
    expect(hasFeature("github-write")).toBe(false);
  });

  it("detects supabase when url + publishable key are set", () => {
    process.env.SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "pk";
    expect(hasFeature("supabase")).toBe(true);
    expect(hasFeature("supabase-admin")).toBe(false);
  });

  it("detects ai-gateway when LOVABLE_API_KEY is set", () => {
    process.env.LOVABLE_API_KEY = "key";
    expect(hasFeature("ai-gateway")).toBe(true);
  });

  it("does not expose secret values via serverEnv shape", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "super-secret";
    const env = serverEnv();
    // serverEnv returns the value (intended for handler use); just verify
    // it isn't accidentally swapped into a public field name.
    expect(env.supabaseServiceRoleKey).toBe("super-secret");
    expect(Object.keys(env)).not.toContain("VITE_SUPABASE_SERVICE_ROLE_KEY");
  });

  it("requireFeature throws a friendly message without leaking values", () => {
    process.env.SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "should-not-leak";
    expect(() => requireFeature("ai-gateway")).toThrow(/AI gateway is not configured/i);
    try {
      requireFeature("ai-gateway");
    } catch (e) {
      expect(String((e as Error).message)).not.toContain("should-not-leak");
    }
  });

  it("requireFeature does not throw when feature is configured", () => {
    process.env.GITHUB_CLIENT_ID = "id";
    process.env.GITHUB_CLIENT_SECRET = "secret";
    expect(() => requireFeature("github-oauth")).not.toThrow();
  });
});
