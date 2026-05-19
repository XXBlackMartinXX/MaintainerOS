import { createServerFn } from "@tanstack/react-start";
import { serverEnv } from "@/lib/env";

export interface ServerConfigStatus {
  supabaseUrl: boolean;
  supabasePublishableKey: boolean;
  supabaseServiceRoleKey: boolean;
  githubClientId: boolean;
  githubClientSecret: boolean;
  githubWebhookSecret: boolean;
  lovableApiKey: boolean;
  supabaseProjectRef: string | null;
}

/**
 * Returns booleans only — never the secret values themselves. Safe to expose
 * to the browser via a server function call.
 */
export const getServerConfigStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<ServerConfigStatus> => {
    const env = serverEnv();
    let projectRef: string | null = null;
    if (env.supabaseUrl) {
      try {
        const host = new URL(env.supabaseUrl).host;
        projectRef = host.split(".")[0] || null;
      } catch {
        projectRef = null;
      }
    }
    return {
      supabaseUrl: Boolean(env.supabaseUrl),
      supabasePublishableKey: Boolean(env.supabasePublishableKey),
      supabaseServiceRoleKey: Boolean(env.supabaseServiceRoleKey),
      githubClientId: Boolean(env.githubClientId),
      githubClientSecret: Boolean(env.githubClientSecret),
      githubWebhookSecret: Boolean(env.githubWebhookSecret),
      lovableApiKey: Boolean(env.lovableApiKey),
      supabaseProjectRef: projectRef,
    };
  },
);
