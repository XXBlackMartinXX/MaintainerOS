import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, DemoBadge, AIBadge, SeverityPill } from "@/components/ui-bits";
import { RepoSelector } from "@/components/repo-selector";
import { Button } from "@/components/ui/button";
import { demoIssues, type DemoIssue } from "@/lib/demo-data";
import { Check, X, Pencil, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/app/issues")({
  component: IssuesPage,
});

function IssuesPage() {
  const [selected, setSelected] = useState<DemoIssue>(demoIssues[0]);
  return (
    <div>
      <PageHeader
        title="AI Issue Triage"
        description="AI drafts a type, severity, priority, labels, and a suggested response. You decide what gets posted."
        actions={
          <>
            <DemoBadge />
            <RepoSelector />
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 panel rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-medium">Triage queue</h3>
            <span className="text-xs text-muted-foreground">{demoIssues.length} open</span>
          </div>
          <ul>
            {demoIssues.map((i) => (
              <li key={i.id}>
                <button
                  onClick={() => setSelected(i)}
                  className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-accent/40 transition-colors ${
                    selected.id === i.id ? "bg-accent/60" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">#{i.number}</span>
                    <SeverityPill level={i.ai.severity} />
                    <span className="text-[10px] rounded border border-border-strong px-1 py-0.5 font-mono text-muted-foreground">
                      {i.ai.priority}
                    </span>
                    <AIBadge confidence={i.ai.confidence} />
                  </div>
                  <div className="mt-1.5 text-sm text-foreground truncate">{i.title}</div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{i.author}</span>
                    <span>· {i.ageDays}d</span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="size-3" /> {i.comments}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3 panel rounded-xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground font-mono">#{selected.number} · {selected.author}</div>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">{selected.title}</h2>
            </div>
            <a className="text-xs text-primary hover:underline" href="#">Open on GitHub →</a>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <Fact label="Type" value={selected.ai.type} />
            <Fact label="Severity" value={selected.ai.severity} />
            <Fact label="Priority" value={selected.ai.priority} />
            <Fact label="Complexity" value={selected.ai.complexity} />
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2">
              <AIBadge confidence={selected.ai.confidence} />
              <h3 className="text-sm font-medium">Analysis</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{selected.ai.summary}</p>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-medium">Suggested labels</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.ai.suggestedLabels.map((l) => (
                <span key={l} className="text-xs rounded-full border border-border bg-surface px-2 py-0.5">
                  {l}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2">
              <AIBadge />
              <h3 className="text-sm font-medium">Suggested maintainer reply (draft)</h3>
            </div>
            <div className="mt-2 rounded-md border border-border bg-surface p-3 text-sm whitespace-pre-wrap">
              Thanks for the detailed report! Could you confirm the Node version and share a minimal reproduction?
              We'll add the `needs-repro` label while we investigate alongside #1284.
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="sm"><Check className="size-3.5" /> Approve & post</Button>
              <Button size="sm" variant="outline"><Pencil className="size-3.5" /> Edit draft</Button>
              <Button size="sm" variant="ghost" className="text-muted-foreground"><X className="size-3.5" /> Reject</Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Nothing is posted to GitHub until you click Approve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm capitalize mt-0.5">{value}</div>
    </div>
  );
}
