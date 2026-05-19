import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/integrations/supabase/safe-client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    session,
    user,
    loading,
    isAuthenticated: !!user,
    signOut: () => {
      const sb = getSupabase();
      return sb ? sb.auth.signOut() : Promise.resolve({ error: null } as never);
    },
  };
}
