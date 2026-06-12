import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isAiConfigured, callAIJson, AIConfigError } from "@/lib/ai/provider.server";

describe("AI provider boundary", () => {
  const orig = process.env.LOVABLE_API_KEY;
  beforeEach(() => {
    delete process.env.LOVABLE_API_KEY;
  });
  afterEach(() => {
    if (orig === undefined) delete process.env.LOVABLE_API_KEY;
    else process.env.LOVABLE_API_KEY = orig;
  });

  it("reports unconfigured when key missing", () => {
    expect(isAiConfigured()).toBe(false);
  });

  it("throws AIConfigError without making a network call when key missing", async () => {
    await expect(
      callAIJson({ messages: [{ role: "user", content: "hi" }] }),
    ).rejects.toBeInstanceOf(AIConfigError);
  });
});
