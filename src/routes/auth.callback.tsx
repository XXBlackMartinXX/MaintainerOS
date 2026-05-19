import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { getSupabase } from "@/integrations/supabase/safe-client";
import { useServerFn } from "@tanstack/react-start";
import { persistGithubToken, getOnboardingStatus } from "@/lib/github.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const persist = useServerFn(persistGithubToken);
  const status = useServerFn(getOnboardingStatus);
  const [msg, setMsg] = useState("Finishing sign-in…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        // Wait for session — Supabase JS auto-parses the URL hash.
        let session = (await supabase.auth.getSession()).data.session;
        if (!session) {
          await new Promise((r) => setTimeout(r, 400));
          session = (await supabase.auth.getSession()).data.session;
        }
        if (!session) {
          toast.error("Could not establish a session. Please try again.");
          navigate({ to: "/login" });
          return;
        }

        const providerToken = (session as unknown as { provider_token?: string }).provider_token;
        const providerRefresh = (session as unknown as { provider_refresh_token?: string })
          .provider_refresh_token;

        if (providerToken) {
          setMsg("Securing your GitHub access…");
          await persist({
            data: {
              access_token: providerToken,
              refresh_token: providerRefresh ?? null,
              scopes: "read:user user:email repo read:org",
            },
          });
        }

        setMsg("Loading your workspace…");
        const s = await status();
        if (s.connectedRepoCount === 0) {
          navigate({ to: "/onboarding" });
        } else {
          navigate({ to: "/app" });
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Sign-in failed");
        navigate({ to: "/login" });
      }
    })();
  }, [navigate, persist, status]);

  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="text-center">
        <div className="mx-auto size-10 rounded-md bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/30">
          <Sparkles className="size-5" />
        </div>
        <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> {msg}
        </div>
      </div>
    </div>
  );
}
