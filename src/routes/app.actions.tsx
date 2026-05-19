import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ChevronRight, X, Github, ExternalLink, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/ui-bits";
import { listAuditLogs } from "@/lib/ai.functions";
import { getPublishEventForAudit } from "@/lib/github-publish.functions";
import { useHasSession } from "@/hooks/use-has-session";

export const Route = createFileRoute("/app/actions")({ component: ActionsPage });

type LogRow = {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type StatusKind =
  | "success"
  | "failed"
  | "attempted"
  | "duplicate"
  | "approved"
  | "rejected"
  | "edited"
  | "generated"
  | "logged";

function statusForAction(action: string): { label: string; kind: StatusKind } {
  if (action.endsWith(".success")) return { label: "success", kind: "success" };
  if (action.endsWith(".failed")) return { label: "failed", kind: "failed" };
  if (action.endsWith(".attempted")) return { label: "attempted", kind: "attempted" };
  if (action.endsWith(".reposted")) return { label: "duplicate confirmed", kind: "duplicate" };
  if (action.endsWith(".approved") || action.endsWith(".approve"))
    return { label: "approved", kind: "approved" };
  if (action.endsWith(".rejected") || action.endsWith(".reject"))
    return { label: "rejected", kind: "rejected" };
  if (action.endsWith(".edited") || action.endsWith(".edit"))
    return { label: "edited", kind: "edited" };
  if (action.endsWith(".generated")) return { label: "generated", kind: "generated" };
  if (action.endsWith(".copy") || action.endsWith(".copied"))
    return { label: "copied", kind: "logged" };
  return { label: "logged", kind: "logged" };
}

function StatusBadge({ kind, label }: { kind: StatusKind; label: string }) {
  const cls: Record<StatusKind, string> = {
    success: "bg-success/15 text-success border-success/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    attempted: "bg-warning/15 text-warning border-warning/30",
    duplicate: "bg-primary/10 text-primary border-primary/30",
    approved: "bg-success/15 text-success border-success/30",
    rejected: "bg-destructive/10 text-destructive border-destructive/30",
    edited: "bg-warning/10 text-warning border-warning/30",
    generated: "bg-primary/10 text-primary border-primary/30",
    logged: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${cls[kind]}`}
    >
      {label}
    </span>
  );
}

const FILTERS: Array<[string, string]> = [
  ["all", "All"],
  ["ai", "AI events"],
  ["ai.triage", "Triage"],
  ["ai.pr_summary", "PR summaries"],
  ["github", "GitHub publish"],
];

function sourceFromMetadata(
  action: string,
  meta: Record<string, unknown>,
): { source_type: "issue_triage" | "pr_summary" | "release_draft"; source_id: string } | null {
  if (action.startsWith("github.issue_")) {
    const id = meta.triage_id;
    if (typeof id === "string") return { source_type: "issue_triage", source_id: id };
  }
  if (action.startsWith("github.pr_")) {
    const id = meta.summary_id;
    if (typeof id === "string") return { source_type: "pr_summary", source_id: id };
  }
  if (action.startsWith("github.release_")) {
    const id = meta.draft_id;
    if (typeof id === "string") return { source_type: "release_draft", source_id: id };
  }
  return null;
}

function ActionsPage() {
  const fn = useServerFn(listAuditLogs);
  const [filter, setFilter] = useState<string>("all");
  const logsQ = useQuery({
    queryKey: ["audit-logs", filter],
    queryFn: () =>
      fn({ data: { action_prefix: filter === "all" ? undefined : filter, limit: 300 } }),
  });
  const [selected, setSelected] = useState<LogRow | null>(null);

  const logs = (logsQ.data?.logs ?? []) as LogRow[];
  const counts = useMemo(() => {
    const c = { total: logs.length, success: 0, failed: 0, attempted: 0, duplicate: 0 };
    for (const l of logs) {
      const k = statusForAction(l.action).kind;
      if (k === "success") c.success++;
      else if (k === "failed") c.failed++;
      else if (k === "attempted") c.attempted++;
      else if (k === "duplicate") c.duplicate++;
    }
    return c;
  }, [logs]);

  return (
    <div>
      <PageHeader
        title="AI Action Log"
        description="Every AI draft, approval, edit, rejection, copy, failure, and GitHub publish event — fully auditable."
      />

      <div className="panel rounded-xl p-3 mb-4 flex items-center gap-2 flex-wrap text-xs">
        <span className="text-muted-foreground mr-1">Filter:</span>
        {FILTERS.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-md border px-2 py-1 ${filter === k ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface hover:bg-accent"}`}
          >
            {k === "github" && <Github className="size-3 inline mr-1 -mt-0.5" />}
            {l}
          </button>
        ))}
        <span className="ml-auto text-muted-foreground">
          {counts.total} events · {counts.success} success · {counts.failed} failed ·{" "}
          {counts.attempted} attempted · {counts.duplicate} duplicate
        </span>
      </div>

      <div className="panel rounded-xl overflow-hidden">
        {logsQ.isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin inline mr-2" />
            Loading…
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No actions yet. Generate a triage draft from the Issues page or publish an approved
            draft.
          </div>
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
                const meta = (l.metadata ?? {}) as Record<string, unknown>;
                const model = typeof meta.model === "string" ? meta.model : "—";
                const isGithub = l.action.startsWith("github.");
                return (
                  <tr
                    key={l.id}
                    className={`border-t border-border hover:bg-accent/30 cursor-pointer ${isGithub ? "bg-primary/[0.03]" : ""}`}
                    onClick={() => setSelected(l)}
                  >
                    <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {isGithub && <Github className="size-3 inline mr-1 -mt-0.5 text-primary" />}
                      {l.action}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge kind={s.kind} label={s.label} />
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {l.target_type ?? "—"}
                      {l.target_id ? ` · ${l.target_id.slice(0, 8)}` : ""}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{model}</td>
                    <td className="px-2 py-2 text-muted-foreground">
                      <ChevronRight className="size-3.5" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && <DetailsDrawer log={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function DetailsDrawer({ log, onClose }: { log: LogRow; onClose: () => void }) {
  const meta = (log.metadata ?? {}) as Record<string, unknown>;
  const status = statusForAction(log.action);
  const isGithub = log.action.startsWith("github.");
  const src = sourceFromMetadata(log.action, meta);

  const getEvent = useServerFn(getPublishEventForAudit);
  const eventQ = useQuery({
    queryKey: ["publish-event", src?.source_type, src?.source_id],
    queryFn: () => getEvent({ data: src! }),
    enabled: isGithub && !!src,
  });
  const event = eventQ.data?.event ?? null;

  const [showRaw, setShowRaw] = useState(false);

  const errorMessage = typeof meta.error === "string" ? meta.error : (event?.error_message ?? null);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <aside
        className="relative z-10 h-full w-full max-w-md overflow-y-auto border-l border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            {isGithub && <Github className="size-4 text-primary" />}
            {isGithub ? "Publish event details" : "Audit details"}
          </h2>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>
        <div className="p-4 space-y-4 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge kind={status.kind} label={status.label} />
            <span className="font-mono text-xs text-muted-foreground">{log.action}</span>
          </div>

          <Field label="When">{new Date(log.created_at).toLocaleString()}</Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Target type">{log.target_type ?? "—"}</Field>
            <Field label="Target id / number">
              <span className="font-mono text-xs break-all">
                {log.target_id ?? event?.target_id ?? "—"}
              </span>
            </Field>
          </div>

          {isGithub && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Source type">{src?.source_type ?? event?.source_type ?? "—"}</Field>
                <Field label="Source id">
                  <span className="font-mono text-[10px] break-all">
                    {src?.source_id ?? event?.source_id ?? "—"}
                  </span>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Publish status">
                  {eventQ.isLoading ? (
                    <span className="text-muted-foreground">
                      <Loader2 className="size-3 animate-spin inline mr-1" />
                      loading…
                    </span>
                  ) : event ? (
                    <span className="capitalize">{event.status}</span>
                  ) : (
                    <span className="text-muted-foreground">no publish event</span>
                  )}
                </Field>
                <Field label="Repository">
                  <span className="font-mono text-[10px] break-all">
                    {event?.repository_id ?? "—"}
                  </span>
                </Field>
              </div>

              {event?.github_url && (
                <Field label="GitHub URL">
                  <a
                    href={event.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 break-all"
                  >
                    {event.github_url}
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                </Field>
              )}

              {status.kind === "duplicate" && (
                <div className="rounded-md border border-primary/30 bg-primary/10 p-2 text-xs">
                  This event was posted again after a previous publish to the same target.
                  Duplicate-post protection required explicit confirmation.
                </div>
              )}
            </>
          )}

          {errorMessage && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Error
              </div>
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive whitespace-pre-wrap break-words">
                {errorMessage}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Error messages are sanitised — GitHub tokens and secrets are never logged.
              </p>
            </div>
          )}

          <Field label="User">
            <span className="font-mono text-[10px] break-all">{event?.user_id ?? "you"}</span>
          </Field>

          <div>
            <button
              onClick={() => setShowRaw((s) => !s)}
              className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              <ChevronDown
                className={`size-3 transition-transform ${showRaw ? "" : "-rotate-90"}`}
              />
              Advanced · raw metadata
            </button>
            {showRaw && (
              <div className="mt-2 space-y-2">
                <div>
                  <div className="text-[10px] text-muted-foreground mb-1">audit_logs.metadata</div>
                  <pre className="rounded-md border border-border bg-background p-2 text-[10px] overflow-x-auto">
                    {JSON.stringify(log.metadata ?? {}, null, 2)}
                  </pre>
                </div>
                {event && (
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1">
                      github_publish_events
                    </div>
                    <pre className="rounded-md border border-border bg-background p-2 text-[10px] overflow-x-auto">
                      {JSON.stringify(event, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
