import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ChevronRight, X } from "lucide-react";
import { PageHeader } from "@/components/ui-bits";
import { listAuditLogs } from "@/lib/ai.functions";

export const Route = createFileRoute("/app/actions")({ component: ActionsPage });

type LogRow = {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function statusForAction(action: string): { label: string; cls: string } {
  if (action.endsWith(".approved") || action.endsWith(".approve")) return { label: "approved", cls: "text-success" };
  if (action.endsWith(".rejected") || action.endsWith(".reject")) return { label: "rejected", cls: "text-destructive" };
  if (action.endsWith(".edited") || action.endsWith(".edit")) return { label: "edited", cls: "text-warning" };
  if (action.endsWith(".failed")) return { label: "failed", cls: "text-destructive" };
  if (action.endsWith(".generated")) return { label: "generated", cls: "text-primary" };
  if (action.endsWith(".copy") || action.endsWith(".copied")) return { label: "copied", cls: "text-muted-foreground" };
  return { label: "logged", cls: "text-muted-foreground" };
}

function ActionsPage() {
  const fn = useServerFn(listAuditLogs);
  const [filter, setFilter] = useState<string>("ai");
  const logsQ = useQuery({
    queryKey: ["audit-logs", filter],
    queryFn: () => fn({ data: { action_prefix: filter === "all" ? undefined : filter, limit: 300 } }),
  });
  const [selected, setSelected] = useState<LogRow | null>(null);

  const logs = (logsQ.data?.logs ?? []) as LogRow[];
  const counts = useMemo(() => {
    const c = { total: logs.length, approved: 0, rejected: 0, failed: 0, generated: 0 };
    for (const l of logs) {
      const s = statusForAction(l.action).label;
      if (s in c) (c as Record<string, number>)[s]++;
    }
    return c;
  }, [logs]);

  return (
    <div>
      <PageHeader
        title="AI Action Log"
        description="Every AI draft, approval, edit, rejection, copy, and failure — fully auditable."
      />

      <div className="panel rounded-xl p-3 mb-4 flex items-center gap-3 flex-wrap text-xs">
        <span className="text-muted-foreground">Filter:</span>
        {[
          ["ai", "AI events"],
          ["ai.triage", "Triage only"],
          ["github", "GitHub"],
          ["all", "All"],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-md border px-2 py-1 ${filter === k ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface hover:bg-accent"}`}>{l}</button>
        ))}
        <span className="ml-auto text-muted-foreground">
          {counts.total} events · {counts.generated} generated · {counts.approved} approved · {counts.rejected} rejected · {counts.failed} failed
        </span>
      </div>

      <div className="panel rounded-xl overflow-hidden">
        {logsQ.isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin inline mr-2" />Loading…</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No AI actions yet. Generate a triage draft from the Issues page.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-medium">When</th>
                <th className="text-left px-4 py-2 font-medium">Action</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Target</th>
                <th className="text-left px-4 py-2 font-medium">Model</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => {
                const s = statusForAction(l.action);
                const meta = l.metadata ?? {};
                const model = typeof meta.model === "string" ? meta.model : "—";
                return (
                  <tr key={l.id} className="border-t border-border hover:bg-accent/30 cursor-pointer" onClick={() => setSelected(l)}>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</td>
                    <td className="px-4 py-2 font-mono text-xs">{l.action}</td>
                    <td className={`px-4 py-2 text-xs font-medium ${s.cls}`}>{s.label}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{l.target_type ?? "—"}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{model}</td>
                    <td className="px-2 py-2 text-muted-foreground"><ChevronRight className="size-3.5" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <aside className="relative z-10 h-full w-full max-w-md overflow-y-auto border-l border-border bg-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3">
              <h2 className="text-sm font-semibold">Audit details</h2>
              <button onClick={() => setSelected(null)} className="rounded-md p-1.5 hover:bg-accent"><X className="size-4" /></button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Action</div><div className="font-mono">{selected.action}</div></div>
              <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">When</div><div>{new Date(selected.created_at).toLocaleString()}</div></div>
              <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Target</div><div className="font-mono text-xs">{selected.target_type} · {selected.target_id ?? "—"}</div></div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Metadata</div>
                <pre className="rounded-md border border-border bg-background p-2 text-xs overflow-x-auto">{JSON.stringify(selected.metadata ?? {}, null, 2)}</pre>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
