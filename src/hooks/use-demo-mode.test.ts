import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { demoConnectedRepos } from "./use-selected-repo";
import { DEMO_MODE_EVENT, DEMO_MODE_STORAGE_KEY, enableDemoMode } from "./use-demo-mode";

function readSource(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("enableDemoMode", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("uses the stable localStorage key", () => {
    enableDemoMode();
    expect(DEMO_MODE_STORAGE_KEY).toBe("mos.demoMode");
    expect(window.localStorage.getItem(DEMO_MODE_STORAGE_KEY)).toBe("1");
  });

  it("is idempotent", () => {
    enableDemoMode();
    enableDemoMode();
    expect(window.localStorage.getItem(DEMO_MODE_STORAGE_KEY)).toBe("1");
  });

  it("dispatches the mos:demo-mode event", () => {
    let fired = 0;
    const handler = () => fired++;
    expect(DEMO_MODE_EVENT).toBe("mos:demo-mode");
    window.addEventListener(DEMO_MODE_EVENT, handler);
    enableDemoMode();
    window.removeEventListener(DEMO_MODE_EVENT, handler);
    expect(fired).toBe(1);
  });

  it("does not depend on Supabase being configured", () => {
    // No supabase env access in this module path; calling does not throw.
    expect(() => enableDemoMode()).not.toThrow();
  });

  it("demo route enables demo mode before navigating to the app shell", () => {
    const src = readSource("src/routes/demo.tsx");
    expect(src).toMatch(/import \{ enableDemoMode \} from "@\/hooks\/use-demo-mode"/);
    expect(src.indexOf("enableDemoMode();")).toBeLessThan(src.indexOf('navigate({ to: "/app"'));
  });

  it("app shell auth guard checks the same demo-mode storage key", () => {
    const src = readSource("src/routes/app.tsx");
    expect(src).toMatch(/DEMO_MODE_STORAGE_KEY/);
    expect(src).toMatch(/localStorage\.getItem\(DEMO_MODE_STORAGE_KEY\) === "1"/);
  });

  it("demo mode exposes sample repositories without a live backend session", () => {
    expect(demoConnectedRepos.length).toBeGreaterThan(0);
    expect(demoConnectedRepos[0]).toMatchObject({
      id: "demo-1",
      full_name: "acme/atlas",
      visibility: "public",
      html_url: null,
    });
  });

  it("persistent demo banner copy remains present", () => {
    const src = readSource("src/components/demo-banner.tsx");
    expect(src).toMatch(/Demo mode active/);
    expect(src).toMatch(/illustrative sample data/);
    expect(src).toMatch(/Publishing\s+and GitHub sync are disabled/);
  });
});
