import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Github, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Sign in — MaintainerOS" }],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  const signInWithGitHub = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "read:user user:email repo read:org",
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background grid-bg grid place-items-center px-4">
      <div className="w-full max-w-md panel-elevated rounded-2xl p-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="size-7 rounded-md bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/30">
            <Sparkles className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">MaintainerOS</span>
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect your GitHub account to read your repositories.
        </p>
        <Button size="lg" className="mt-6 w-full" onClick={signInWithGitHub} disabled={loading}>
          <Github className="size-4" /> {loading ? "Redirecting…" : "Continue with GitHub"}
        </Button>
        <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3" /> Read-only by default. Nothing is posted without your approval.
        </p>
        <p className="mt-6 text-xs text-muted-foreground">
          First-time setup requires the GitHub auth provider to be enabled in the Lovable Cloud
          backend settings.
        </p>
      </div>
    </div>
  );
}
