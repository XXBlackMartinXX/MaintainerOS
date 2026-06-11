export type SetupItemStatus = "configured" | "missing" | "manual_verification_required";

export type SetupChecklistItem = {
  key: string;
  label: string;
  status: SetupItemStatus;
  why: string;
  nextStep: string;
  /** "lovable" means the platform handles it; "owner" means the user must act in GitHub/Supabase. */
  handledBy: "lovable" | "owner";
};

export type SetupChecklistInput = {
  supabaseClientConfigured: boolean;
  supabaseServerConfigured: boolean;
  aiGatewayConfigured: boolean;
  githubProviderConfigured: boolean | null;
  redirectUrlsVerified: boolean;
  oauthScopesVerified: boolean;
  deploymentUrlKnown: boolean;
};

export function buildSetupChecklist(input: SetupChecklistInput): SetupChecklistItem[] {
  const required = (ok: boolean): SetupItemStatus => (ok ? "configured" : "missing");
  const manual = (ok: boolean | null): SetupItemStatus =>
    ok === true ? "configured" : ok === false ? "missing" : "manual_verification_required";

  return [
    {
      key: "supabase_client",
      label: "Client Supabase env vars",
      status: required(input.supabaseClientConfigured),
      why: "Required so the browser can talk to the Supabase Auth and Data API.",
      nextStep: "Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set.",
      handledBy: "lovable",
    },
    {
      key: "supabase_server",
      label: "Server Supabase env vars",
      status: required(input.supabaseServerConfigured),
      why: "Required for server functions to read/write privileged data.",
      nextStep: "Ensure SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SERVICE_ROLE_KEY are set.",
      handledBy: "lovable",
    },
    {
      key: "ai_gateway",
      label: "AI gateway",
      status: required(input.aiGatewayConfigured),
      why: "Required to generate triage, PR summary, changelog, and documentation drafts.",
      nextStep: "Ensure LOVABLE_API_KEY is set in the server environment.",
      handledBy: "lovable",
    },
    {
      key: "github_provider",
      label: "GitHub provider in Supabase Auth",
      status: manual(input.githubProviderConfigured),
      why: "Required for users to sign in with GitHub.",
      nextStep:
        "Configure the GitHub provider in the Lovable Cloud auth settings using the GitHub OAuth app's client id and secret.",
      handledBy: "owner",
    },
    {
      key: "redirect_urls",
      label: "Redirect URLs verified",
      status: manual(input.redirectUrlsVerified),
      why: "Supabase rejects callbacks from URLs not on its allow-list.",
      nextStep:
        "Add the app origin and /auth/callback URL to the Supabase auth redirect-URL allow-list.",
      handledBy: "owner",
    },
    {
      key: "oauth_scopes",
      label: "GitHub OAuth scopes",
      status: manual(input.oauthScopesVerified),
      why: "Reading public repo data requires `read:user`; publishing requires `public_repo` (or `repo` for private).",
      nextStep:
        "On the GitHub OAuth app, request scopes `read:user`, `public_repo`. Do not request `repo` unless private repos are required.",
      handledBy: "owner",
    },
    {
      key: "deployment_url",
      label: "Deployment URL known",
      status: required(input.deploymentUrlKnown),
      why: "Needed to set OAuth callback URLs and link from documentation.",
      nextStep: "Decide on a published URL and record it in your GitHub OAuth app + Supabase config.",
      handledBy: "owner",
    },
    {
      key: "demo_mode_verification",
      label: "Demo mode verification",
      status: "manual_verification_required",
      why: "Confirm the demo banner renders, labels fixtures, and disables publishing.",
      nextStep: "Toggle demo mode on the dashboard and verify badges + disabled publish buttons.",
      handledBy: "owner",
    },
  ];
}

export function summariseSetup(items: SetupChecklistItem[]): {
  total: number;
  configured: number;
  missing: number;
  manual: number;
} {
  let configured = 0;
  let missing = 0;
  let manual = 0;
  for (const i of items) {
    if (i.status === "configured") configured++;
    else if (i.status === "missing") missing++;
    else manual++;
  }
  return { total: items.length, configured, missing, manual };
}
