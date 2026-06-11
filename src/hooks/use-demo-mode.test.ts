import { describe, it, expect, beforeEach } from "vitest";
import { enableDemoMode } from "./use-demo-mode";

const KEY = "mos.demoMode";

describe("enableDemoMode", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("uses the stable localStorage key", () => {
    enableDemoMode();
    expect(window.localStorage.getItem(KEY)).toBe("1");
  });

  it("is idempotent", () => {
    enableDemoMode();
    enableDemoMode();
    expect(window.localStorage.getItem(KEY)).toBe("1");
  });

  it("dispatches the mos:demo-mode event", () => {
    let fired = 0;
    const handler = () => fired++;
    window.addEventListener("mos:demo-mode", handler);
    enableDemoMode();
    window.removeEventListener("mos:demo-mode", handler);
    expect(fired).toBe(1);
  });

  it("does not depend on Supabase being configured", () => {
    // No supabase env access in this module path; calling does not throw.
    expect(() => enableDemoMode()).not.toThrow();
  });
});
