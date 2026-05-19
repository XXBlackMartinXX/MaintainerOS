import { useEffect, useState } from "react";
import { getSupabase } from "@/integrations/supabase/safe-client";

/**
 * Returns whether a Supabase session is available.
 * - `null` while the initial check is in flight.
 * - `false` if Supabase is not configured (demo-mode visitors land here).
 * - `true`/`false` once known. Updates on auth state changes.
 */
export function useHasSession(): boolean | null {
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setHasSession(false);
      return;
    }
    let active = true;
    sb.auth
      .getSession()
      .then(({ data }) => {
        if (active) setHasSession(!!data.session);
      })
      .catch(() => {
        if (active) setHasSession(false);
      });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setHasSession(!!session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return hasSession;
}
