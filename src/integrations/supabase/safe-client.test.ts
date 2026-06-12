import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// We re-import safe-client per test so the module sees the current env stubs.
async function loadModule() {
  vi.resetModules();
  return await import("./safe-client");
}

const originalEnv = { ...import.meta.env };

describe("safe-client", () => {
  beforeEach(() => {
    // Reset both vite and node env shapes.
    for (const k of Object.keys(import.meta.env)) {
      if (k.startsWith("VITE_SUPABASE")) {
        (import.meta.env as Record<string, unknown>)[k] = undefined;
      }
    }
  });

  afterEach(() => {
    Object.assign(import.meta.env, originalEnv);
  });

  it("reports unconfigured when env vars are missing", async () => {
    const mod = await loadModule();
    expect(mod.isSupabaseConfigured()).toBe(false);
    // getSupabase must not throw when unconfigured.
    expect(mod.getSupabase()).toBeNull();
  });

  it("reports configured when both URL and key are present", async () => {
    (import.meta.env as Record<string, unknown>).VITE_SUPABASE_URL = "https://example.supabase.co";
    (import.meta.env as Record<string, unknown>).VITE_SUPABASE_PUBLISHABLE_KEY = "dummy-key";
    const mod = await loadModule();
    expect(mod.isSupabaseConfigured()).toBe(true);
  });

  it("never throws or returns secret values from the public API", async () => {
    const mod = await loadModule();
    // Public API exposes only booleans / client handle / null.
    expect(typeof mod.isSupabaseConfigured()).toBe("boolean");
    // No exported function leaks the raw env values.
    const exported = Object.keys(mod);
    expect(exported).toEqual(expect.arrayContaining(["getSupabase", "isSupabaseConfigured"]));
    expect(exported).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
