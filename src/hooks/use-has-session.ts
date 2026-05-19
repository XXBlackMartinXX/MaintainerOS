import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns whether a Supabase session is available.
 * - `null` while the initial check is in flight.
 * - `true`/`false` once known. Updates on auth state changes.
 *
 * Use to gate calls to auth-protected server functions so unauthenticated
 * visitors (including demo-mode visitors) don't trigger 401 errors.
 */
export function useHasSession(): boolean | null {
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setHasSession(!!data.session);
      })
      .catch(() => {
        if (active) setHasSession(false);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setHasSession(!!session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return hasSession;
}
