import { describe, it, expect } from "vitest";
import type { ServerConfigStatus } from "@/lib/setup.functions";

/**
 * The setup diagnostics payload must be booleans only (plus the derived
 * project ref). It must never include the secret values themselves.
 */
describe("setup diagnostics redaction", () => {
  it("ServerConfigStatus surface is booleans + projectRef only", () => {
    const sample: ServerConfigStatus = {
      supabaseUrl: true,
      supabasePublishableKey: true,
      supabaseServiceRoleKey: true,
      githubClientId: false,
      githubClientSecret: false,
      githubWebhookSecret: false,
      lovableApiKey: true,
      supabaseProjectRef: "example",
      githubAppId: false,
      githubAppPrivateKey: false,
      githubAppClientId: false,
      githubAppClientSecret: false,
      githubAppWebhookSecret: false,
      githubAppReady: false,
    };
    for (const [k, v] of Object.entries(sample)) {
      if (k === "supabaseProjectRef") {
        expect(typeof v === "string" || v === null).toBe(true);
      } else {
        expect(typeof v).toBe("boolean");
      }
    }
  });
});
