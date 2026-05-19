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
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
    | string
    | undefined,
  supabaseProjectId: import.meta.env.VITE_SUPABASE_PROJECT_ID as
    | string
    | undefined,
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
  | "github-write";

export interface ServerEnvShape {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  supabaseServiceRoleKey?: string;
  githubClientId?: string;
  githubClientSecret?: string;
  githubWebhookSecret?: string;
  lovableApiKey?: string;
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
      "Lovable Cloud is not configured. Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY.",
    "supabase-admin":
      "Server-side database access is not configured. Missing SUPABASE_SERVICE_ROLE_KEY.",
    "github-oauth":
      "GitHub sign-in is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your Supabase Auth provider settings.",
    "ai-gateway":
      "Lovable AI Gateway is not configured. Set LOVABLE_API_KEY in your Lovable Cloud secrets.",
    "github-write":
      "GitHub write actions require GitHub OAuth to be configured.",
  };
  throw new Error(msg[feature]);
}
