import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Github, Check, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

const STEPS = ["Connect GitHub", "Choose repositories", "Enable AI features", "Maintainer preferences"];

function Onboarding() {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
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
            {step === 1 && (
              <ul className="space-y-2">
                {["acme/atlas", "acme/lumen", "acme/prism-ui"].map((r) => (
                  <li key={r} className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm">
                    <input type="checkbox" defaultChecked className="size-4 accent-primary" />
                    <Github className="size-3.5 text-muted-foreground" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
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
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
            {isLast ? (
              <Button asChild>
                <Link to="/app">Enter dashboard <Check className="size-4" /></Link>
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
