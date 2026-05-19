import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Github, Check, Sparkles, ArrowRight, Loader2, Star, GitFork } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listGithubRepos, connectRepositories } from "@/lib/github.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: Onboarding,
});

const STEPS = ["Connect GitHub", "Choose repositories", "Enable AI features", "Maintainer preferences"];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(() => new Set<number>());
  const [connecting, setConnecting] = useState(false);
  const listRepos = useServerFn(listGithubRepos);
  const connect = useServerFn(connectRepositories);
  const reposQuery = useQuery({
    queryKey: ["github-repos"],
    queryFn: () => listRepos(),
    enabled: step >= 1,
    staleTime: 60_000,
  });
  const isLast = step === STEPS.length - 1;

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const finish = async () => {
    if (selected.size === 0) {
      toast.error("Pick at least one repository");
      return;
    }
    setConnecting(true);
    try {
      await connect({ data: { github_ids: Array.from(selected) } });
      toast.success("Repositories connected");
      navigate({ to: "/app" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to connect");
      setConnecting(false);
    }
  };
  return (
    <div className="min-h-screen bg-background grid-bg">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="size-7 rounded-md bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/30">
            <Sparkles className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">MaintainerOS</span>
        </Link>
        <div className="mt-10 panel-elevated rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Step {step + 1} of {STEPS.length}</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{STEPS[step]}</h1>

          <div className="mt-6 min-h-[200px]">
            {step === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Sign in with GitHub to let MaintainerOS read your repositories.
                </p>
                <Button size="lg"><Github className="size-4" /> Continue with GitHub</Button>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Read-only by default. Nothing is posted without your approval.
                </p>
              </div>
            )}
            {step === 2 && (
              <ul className="space-y-2">
                {["Issue triage", "PR summaries", "Changelog generation", "Documentation suggestions", "Security analysis"].map((f) => (
                  <li key={f} className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm">
                    <input type="checkbox" defaultChecked className="size-4 accent-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
            {step === 3 && (
              <div className="space-y-3 text-sm">
                <Pref label="AI tone" options={["Concise", "Friendly", "Formal"]} active="Friendly" />
                <Pref label="Security sensitivity" options={["Relaxed", "Balanced", "Strict"]} active="Balanced" />
                <Pref label="Auto-draft release notes" options={["Off", "On"]} active="On" />
              </div>
            )}
            {step === 1 && (
              <div>
                {reposQuery.isLoading && (
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading your repositories…</div>
                )}
                {reposQuery.error && (
                  <div className="text-sm text-destructive">{(reposQuery.error as Error).message}</div>
                )}
                {reposQuery.data && (
                  <ul className="space-y-2 max-h-[360px] overflow-auto">
                    {reposQuery.data.repos.map((r) => (
                      <li key={r.github_id} className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 text-sm">
                        <input type="checkbox" checked={selected.has(r.github_id)} onChange={() => toggle(r.github_id)} className="size-4 accent-primary" />
                        <Github className="size-3.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{r.full_name}</div>
                          {r.description && <div className="text-xs text-muted-foreground truncate">{r.description}</div>}
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Star className="size-3" />{r.stars}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><GitFork className="size-3" />{r.forks}</span>
                      </li>
                    ))}
                    {reposQuery.data.repos.length === 0 && (
                      <li className="text-sm text-muted-foreground">No repositories found in your GitHub account.</li>
                    )}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" disabled={step === 0 || connecting} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
            {isLast ? (
              <Button onClick={finish} disabled={connecting || selected.size === 0}>
                {connecting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Connect {selected.size > 0 ? `${selected.size} repo${selected.size === 1 ? "" : "s"}` : "repositories"}
              </Button>
            ) : (
              <Button onClick={() => setStep((s) => s + 1)}>
                Continue <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pref({ label, options, active }: { label: string; options: string[]; active: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
      <span>{label}</span>
      <div className="inline-flex rounded border border-border p-0.5">
        {options.map((o) => (
          <span
            key={o}
            className={`px-2 py-1 text-xs rounded ${
              o === active ? "bg-accent text-foreground" : "text-muted-foreground"
            }`}
          >
            {o}
          </span>
        ))}
      </div>
    </div>
  );
}
