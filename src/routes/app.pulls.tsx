import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, DemoBadge, AIBadge } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { demoPRs, type DemoPR } from "@/lib/demo-data";
import { Check, Pencil, AlertTriangle, GitMerge } from "lucide-react";

export const Route = createFileRoute("/app/pulls")({
  component: PullsPage,
});

function PullsPage() {
  const [selected, setSelected] = useState<DemoPR>(demoPRs[0]);
  return (
    <div>
      <PageHeader
        title="Pull Request Summarizer"
        description="Plain-English summaries, risk signals, and ready-to-edit changelog entries for every open PR."
        actions={<DemoBadge />}
      />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 panel rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-medium">Open PRs</h3>
            <span className="text-xs text-muted-foreground">{demoPRs.length}</span>
          </div>
          <ul>
            {demoPRs.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setSelected(p)}
                  className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-accent/40 ${
                    selected.id === p.id ? "bg-accent/60" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">#{p.number}</span>
                    <span>{p.author}</span>
                    {p.ai.breaking && (
                      <span className="ml-auto inline-flex items-center gap-1 text-destructive">
                        <AlertTriangle className="size-3" /> Breaking
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 text-sm truncate">{p.title}</div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="text-success">+{p.additions}</span>
                    <span className="text-destructive">−{p.deletions}</span>
                    <span>· {p.files} files</span>
                    <span className="ml-auto">readiness {p.ai.mergeReadiness}</span>
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
            <Button size="sm" variant={selected.ai.breaking ? "destructive" : "default"}>
              <GitMerge className="size-3.5" /> Merge readiness {selected.ai.mergeReadiness}
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
            <Fact label="Risk" value={selected.ai.riskLevel} />
            <Fact label="Breaking" value={selected.ai.breaking ? "Yes" : "No"} />
            <Fact label="Category" value={selected.ai.category} />
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2">
              <AIBadge />
              <h3 className="text-sm font-medium">Summary</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{selected.ai.summary}</p>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-medium">Review checklist (suggested)</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {[
                "Tests cover the modified paths",
                "No breaking changes to public API",
                "Documentation updated where needed",
                "Security-sensitive code reviewed",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="size-4 rounded border border-border" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2">
              <AIBadge />
              <h3 className="text-sm font-medium">Suggested changelog entry</h3>
            </div>
            <div className="mt-2 rounded-md border border-border bg-surface p-3 text-sm font-mono">
              **{selected.ai.category}** — {selected.ai.changelogEntry}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm"><Check className="size-3.5" /> Add to next release</Button>
              <Button size="sm" variant="outline"><Pencil className="size-3.5" /> Edit</Button>
            </div>
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
