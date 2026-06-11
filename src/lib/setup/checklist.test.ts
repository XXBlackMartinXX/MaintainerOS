import { describe, it, expect } from "vitest";
import { buildSetupChecklist, summariseSetup } from "./checklist";

const base = {
  supabaseClientConfigured: false,
  supabaseServerConfigured: false,
  aiGatewayConfigured: false,
  githubProviderConfigured: null as boolean | null,
  redirectUrlsVerified: false,
  oauthScopesVerified: false,
  deploymentUrlKnown: false,
};

describe("buildSetupChecklist", () => {
  it("classifies required env vars as missing when unset", () => {
    const items = buildSetupChecklist(base);
    expect(items.find((i) => i.key === "supabase_client")?.status).toBe("missing");
    expect(items.find((i) => i.key === "supabase_server")?.status).toBe("missing");
    expect(items.find((i) => i.key === "ai_gateway")?.status).toBe("missing");
  });

  it("marks unknown manual items as manual_verification_required", () => {
    const items = buildSetupChecklist(base);
    expect(items.find((i) => i.key === "github_provider")?.status).toBe(
      "manual_verification_required",
    );
  });

  it("marks env vars configured when present", () => {
    const items = buildSetupChecklist({
      ...base,
      supabaseClientConfigured: true,
      supabaseServerConfigured: true,
      aiGatewayConfigured: true,
    });
    expect(items.find((i) => i.key === "supabase_client")?.status).toBe("configured");
    expect(items.find((i) => i.key === "ai_gateway")?.status).toBe("configured");
  });

  it("flags owner-handled items so the UI can render them differently", () => {
    const items = buildSetupChecklist(base);
    const ownerKeys = items.filter((i) => i.handledBy === "owner").map((i) => i.key);
    expect(ownerKeys).toEqual(
      expect.arrayContaining([
        "github_provider",
        "redirect_urls",
        "oauth_scopes",
        "deployment_url",
        "demo_mode_verification",
      ]),
    );
  });

  it("summariseSetup counts statuses", () => {
    const items = buildSetupChecklist({
      ...base,
      supabaseClientConfigured: true,
      supabaseServerConfigured: true,
      aiGatewayConfigured: true,
      deploymentUrlKnown: true,
    });
    const sum = summariseSetup(items);
    expect(sum.total).toBe(items.length);
    expect(sum.configured + sum.missing + sum.manual).toBe(sum.total);
    expect(sum.configured).toBeGreaterThanOrEqual(4);
  });
});
