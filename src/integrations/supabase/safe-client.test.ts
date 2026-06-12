import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

async function loadModule() {
  vi.resetModules();
  return await import("./safe-client");
}

describe("safe-client", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("SUPABASE_ANON_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports unconfigured when env vars are missing", async () => {
    const mod = await loadModule();
    expect(mod.isSupabaseConfigured()).toBe(false);
    // getSupabase must not throw when unconfigured — this is what keeps
    // /login, /demo, and the marketing routes alive on a fresh deploy.
    expect(mod.getSupabase()).toBeNull();
  });

  it("reports configured when both URL and key are present", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "dummy-publishable-key");
    const mod = await loadModule();
    expect(mod.isSupabaseConfigured()).toBe(true);
  });

  it("never exposes secret values from the public API", async () => {
    const mod = await loadModule();
    expect(typeof mod.isSupabaseConfigured()).toBe("boolean");
    const exported = Object.keys(mod);
    expect(exported).toEqual(expect.arrayContaining(["getSupabase", "isSupabaseConfigured"]));
    // No exported function name leaks a service-role-style identifier.
    for (const name of exported) {
      expect(name.toLowerCase()).not.toContain("service_role");
      expect(name.toLowerCase()).not.toContain("servicerole");
    }
  });
});
