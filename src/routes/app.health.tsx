import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";
import { PageHeader, DemoBadge } from "@/components/ui-bits";
import { HealthScoreCard } from "@/components/health-score-card";
import { healthBreakdown } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/health")({
  component: HealthPage,
});

function HealthPage() {
  return (
    <div>
      <PageHeader
        title="Repo Health Center"
        description="A weighted score across signals that matter for sustainable open source."
        actions={<DemoBadge />}
      />
      <HealthScoreCard />
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {healthBreakdown.categories.map((c) => (
          <div key={c.key} className="panel rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{c.key}</h3>
              <span
                className={`tabular-nums text-lg font-semibold ${
                  c.score >= 80 ? "text-success" : c.score >= 60 ? "text-warning" : "text-destructive"
                }`}
              >
                {c.score}
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  c.score >= 80 ? "bg-success" : c.score >= 60 ? "bg-warning" : "bg-destructive"
                }`}
                style={{ width: `${c.score}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{c.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 panel rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-md bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/30">
            <Sparkles className="size-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">AI-suggested improvements</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                "Add CODEOWNERS to route PR reviews automatically.",
                "Triage 5 issues older than 60 days (drafts ready).",
                "Update node-fetch to a maintained version.",
                "Add release process docs to make first-time releases easier.",
              ].map((t) => (
                <li key={t} className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
                  <span>{t}</span>
                  <Button size="sm" variant="outline" className="text-xs">
                    Review draft <ArrowRight className="size-3" />
                  </Button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Suggestions are drafts only. Nothing is applied until you approve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
