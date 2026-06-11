/**
 * Central environment-variable validation.
 *
 * Two surfaces:
 *  - `clientEnv` — safe to read from the browser. Only `VITE_*` vars.
 *  - `serverEnv()` — call inside a server function. Reads `process.env`.
 *
 * SECURITY: Never log values from `serverEnv()`. Never re-export server env
 * from a module that the browser imports.
 */

/** Browser-safe public configuration (build-time inlined by Vite). */
export const clientEnv = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string | undefined) || undefined,
  supabasePublishableKey:
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
    undefined,
  supabaseProjectId: import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined,
};

/** Optional client features. Useful for hiding UI when not configured. */
export const clientFeatures = {
  hasSupabase: Boolean(clientEnv.supabaseUrl && clientEnv.supabasePublishableKey),
};

export type ServerFeature =
  | "supabase"
  | "supabase-admin"
  | "github-oauth"
  | "ai-gateway"
  | "github-write"
  | "github-app";

export interface ServerEnvShape {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  supabaseServiceRoleKey?: string;
  githubClientId?: string;
  githubClientSecret?: string;
  githubWebhookSecret?: string;
  lovableApiKey?: string;
  // ── Future GitHub App support (scaffold only; see docs/GITHUB_APP_MIGRATION_PLAN.md).
  // Detected but NOT consumed by any runtime path yet. Their absence must
  // never break the current OAuth flow.
  githubAppId?: string;
  githubAppPrivateKey?: string;
  githubAppClientId?: string;
  githubAppClientSecret?: string;
  githubAppWebhookSecret?: string;
}

/**
 * Read server-only environment variables. Call inside `.handler()` so values
 * are read at request time, not at module-load time.
 */
export function serverEnv(): ServerEnvShape {
  return {
    supabaseUrl: process.env.SUPABASE_URL,
    supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    githubClientId: process.env.GITHUB_CLIENT_ID,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
    githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
    lovableApiKey: process.env.LOVABLE_API_KEY,
    githubAppId: process.env.GITHUB_APP_ID,
    githubAppPrivateKey: process.env.GITHUB_APP_PRIVATE_KEY,
    githubAppClientId: process.env.GITHUB_APP_CLIENT_ID,
    githubAppClientSecret: process.env.GITHUB_APP_CLIENT_SECRET,
    githubAppWebhookSecret: process.env.GITHUB_APP_WEBHOOK_SECRET,
  };
}

export function hasFeature(feature: ServerFeature, env = serverEnv()): boolean {
  switch (feature) {
    case "supabase":
      return Boolean(env.supabaseUrl && env.supabasePublishableKey);
    case "supabase-admin":
      return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
    case "github-oauth":
      return Boolean(env.githubClientId && env.githubClientSecret);
    case "ai-gateway":
      return Boolean(env.lovableApiKey);
    case "github-write":
      // OAuth must be configured; the per-user token is checked separately
      // at call time via Supabase Auth.
      return Boolean(env.githubClientId && env.githubClientSecret);
    case "github-app":
      // Scaffold detection only. Returning true does NOT activate any
      // runtime path — see docs/GITHUB_APP_MIGRATION_PLAN.md.
      return Boolean(env.githubAppId && env.githubAppPrivateKey);
  }
}

/**
 * Throw a friendly error if a required server feature is not configured.
 * Returned messages are safe to surface to maintainers (no secret values).
 */
export function requireFeature(feature: ServerFeature, env = serverEnv()): void {
  if (hasFeature(feature, env)) return;
  const msg: Record<ServerFeature, string> = {
    supabase:
      "the backend (Supabase) is not configured. Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY.",
    "supabase-admin":
      "Server-side database access is not configured. Missing SUPABASE_SERVICE_ROLE_KEY.",
    "github-oauth":
      "GitHub sign-in is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your Supabase Auth provider settings.",
    "ai-gateway":
      "managed AI gateway is not configured. Set LOVABLE_API_KEY in your backend secrets.",
    "github-write": "GitHub write actions require GitHub OAuth to be configured.",
    "github-app":
      "GitHub App support is not configured. This is a future-only scaffold; set GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY when the App migration lands.",
  };
  throw new Error(msg[feature]);
}
