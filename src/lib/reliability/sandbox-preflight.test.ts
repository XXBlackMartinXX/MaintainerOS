import { describe, it, expect } from "vitest";
import { classifyEnv, formatReport } from "./sandbox-preflight";

describe("sandbox preflight", () => {
  it("redacts values: report never echoes secret values", () => {
    const env = {
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "super-secret-publishable-key-DO-NOT-LEAK",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "super-secret-publishable-key-DO-NOT-LEAK",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key-DO-NOT-LEAK",
      LOVABLE_API_KEY: "lovable-key-DO-NOT-LEAK",
    };
    const report = formatReport(classifyEnv(env));
    expect(report).not.toContain("DO-NOT-LEAK");
  });

  it("classifies missing optional vars without failing", () => {
    const result = classifyEnv({
      VITE_SUPABASE_URL: "https://x.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "k",
      SUPABASE_URL: "https://x.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "k",
      SUPABASE_SERVICE_ROLE_KEY: "k",
    });
    expect(result.malformed).toEqual([]);
    expect(result.canTrySupabase).toBe(true);
    expect(result.canTryAi).toBe(false);
    expect(result.canTryGithubOauth).toBe(false);
  });

  it("flags malformed URLs", () => {
    const result = classifyEnv({ SUPABASE_URL: "not a url" });
    expect(result.malformed).toContain("SUPABASE_URL");
  });

  it("classifies fully empty env as missing (not malformed)", () => {
    const result = classifyEnv({});
    expect(result.malformed).toEqual([]);
    const missingRequired = result.rows.filter((r) => r.required && r.status === "missing");
    expect(missingRequired.length).toBeGreaterThan(0);
  });
});
