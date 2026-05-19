import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useProductTour } from "@/hooks/use-product-tour";
import { Button } from "@/components/ui/button";

const STEPS = [
  { title: "Repository selector", body: "Pick which connected GitHub repository MaintainerOS focuses on. You can switch at any time from the top bar.", to: "/app" },
  { title: "Sync status", body: "MaintainerOS only ever reads GitHub. The sync status card shows how fresh your data is and lets you re-sync on demand.", to: "/app" },
  { title: "Issue triage", body: "AI drafts type, severity, priority, labels, and a reply for each issue. Nothing is posted until you approve and confirm.", to: "/app/issues" },
  { title: "PR summaries", body: "Plain-English summaries, risk level, and a ready-to-edit changelog entry for every merged pull request.", to: "/app/pulls" },
  { title: "Changelog drafts", body: "Group merged PRs into Added / Changed / Fixed and generate release notes you can edit before publishing.", to: "/app/changelog" },
  { title: "Documentation", body: "Generate README, CONTRIBUTING, SECURITY and more as editable drafts. You copy them into your repo — MaintainerOS never commits for you.", to: "/app/docs" },
  { title: "GitHub write actions", body: "When you publish a draft, a confirmation dialog shows exactly what will be sent. Duplicate posts are blocked automatically.", to: "/app/issues" },
  { title: "AI Action Log", body: "Every AI call and GitHub publish event is recorded with model, outcome, and source draft for full auditability.", to: "/app/actions" },
  { title: "Readiness checklist", body: "Track how close your repo is to open-source ready: docs, security signals, sync health, and more.", to: "/app/readiness" },
];

export function ProductTour() {
  const { completed, complete } = useProductTour();
  const navigate = useNavigate();
  const [i, setI] = useState(0);

  if (completed) return null;
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  const go = async (next: number) => {
    setI(next);
    const target = STEPS[next];
    if (target.to) await navigate({ to: target.to });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(380px,calc(100vw-2rem))] panel rounded-xl shadow-[var(--shadow-panel)] border-primary/30 ring-1 ring-primary/20">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Sparkles className="size-4 text-primary" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Quick tour · {i + 1} of {STEPS.length}
        </span>
        <button
          onClick={complete}
          aria-label="Skip tour"
          className="ml-auto rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium">{step.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
      </div>
      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => go(Math.max(0, i - 1))}
          disabled={i === 0}
        >
          <ChevronLeft className="size-3.5" /> Back
        </Button>
        <button
          onClick={complete}
          className="text-[11px] text-muted-foreground hover:text-foreground"
        >
          Skip
        </button>
        <div className="ml-auto">
          {last ? (
            <Button size="sm" onClick={complete}>Done</Button>
          ) : (
            <Button size="sm" onClick={() => go(i + 1)}>
              Next <ChevronRight className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
