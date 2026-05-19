/**
 * Safe wrapper around the auto-generated Supabase client.
 *
 * The generated client throws synchronously the first time its proxy is
 * accessed if `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` (or their `VITE_`
 * counterparts) are missing. That breaks demo-mode visitors and crashes
 * routes that only need to *check* whether a session exists.
 *
 * `getSupabase()` returns the client when configured, or `null` when not,
 * never throwing. `isSupabaseConfigured()` is a fast boolean check that
 * does not initialize the client.
 *
 * Service-role keys are NEVER read here — this module is browser-safe.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as supabaseProxy } from "@/integrations/supabase/client";

function readPublicEnv(): { url?: string; key?: string } {
  // Vite inlines `import.meta.env.VITE_*` at build time.
  const meta = (typeof import.meta !== "undefined" ? import.meta.env : {}) as Record<
    string,
    string | undefined
  >;
  const url =
    meta.VITE_SUPABASE_URL ||
    (typeof process !== "undefined" ? process.env?.SUPABASE_URL : undefined);
  const key =
    meta.VITE_SUPABASE_PUBLISHABLE_KEY ||
    meta.VITE_SUPABASE_ANON_KEY ||
    (typeof process !== "undefined"
      ? process.env?.SUPABASE_PUBLISHABLE_KEY || process.env?.SUPABASE_ANON_KEY
      : undefined);
  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = readPublicEnv();
  return Boolean(url && key);
}

let warned = false;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    if (!warned && typeof console !== "undefined") {
      warned = true;
      console.warn(
        "[supabase] Not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY " +
          "(or SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY) to enable live features. " +
          "Demo mode will continue to work.",
      );
    }
    return null;
  }
  try {
    // The proxy initializes lazily on first property access.
    void supabaseProxy.auth;
    return supabaseProxy as unknown as SupabaseClient;
  } catch (err) {
    console.error("[supabase] Failed to initialize client:", err);
    return null;
  }
}
