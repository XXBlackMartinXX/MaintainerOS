import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Search, MessageSquare, Loader2, Sparkles, X, Copy, Check, XCircle,
  AlertTriangle, Pencil,
} from "lucide-react";
import { PageHeader } from "@/components/ui-bits";
import { RepoSelector } from "@/components/repo-selector";
import { DataSourceBadge } from "@/components/data-source-badge";
import { SyncNowButton } from "@/components/sync-now-button";
import { EmptyRepositoryState, EmptySyncedDataState } from "@/components/empty-states";
import { useSelectedRepo } from "@/hooks/use-selected-repo";
import { fetchIssues } from "@/lib/github.functions";
import { triageIssue, listTriageForRepo, updateTriageDraft, getAiStatus } from "@/lib/ai.functions";
import {
  publishIssueComment,
  publishIssueLabels,
  getGithubWritePermissions,
  listPublishEventsForSource,
} from "@/lib/github-publish.functions";
import { PublishConfirmDialog } from "@/components/publish-confirm-dialog";
import type { TriageResult } from "@/lib/ai/schemas";

export const Route = createFileRoute("/app/issues")({ component: IssuesPage });

type SortKey = "updated" | "newest" | "oldest" | "comments";
type StateFilter = "all" | "open" | "closed";
type IssueLabel = { name: string; color?: string | null };

type TriageRow = {
  id: string;
  issue_id: string;
  model: string;
  result: TriageResult;
  suggested_reply: string | null;
  approval_status: string;
  created_at: string;
  updated_at: string;
};

function isStale(updatedAt: string | null) {
  if (!updatedAt) return false;
  return (Date.now() - new Date(updatedAt).getTime()) / 86_400_000 > 60;
}

const severityClass: Record<string, string> = {
  critical: "border-destructive/40 bg-destructive/10 text-destructive",
  high: "border-warning/40 bg-warning/10 text-warning",
  medium: "border-border bg-muted text-foreground",
  low: "border-border bg-surface text-muted-foreground",
  unknown: "border-border bg-surface text-muted-foreground",
};

function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-[10px] rounded border px-1.5 py-0.5 font-medium ${className}`}>{children}</span>
  );
}

function IssuesPage() {
  const { selected, hasConnectedRepo, isLoading: reposLoading } = useSelectedRepo();
  const qc = useQueryClient();
  const fetchIssuesFn = useServerFn(fetchIssues);
  const listTriageFn = useServerFn(listTriageForRepo);
  const triageFn = useServerFn(triageIssue);
  const updateTriageFn = useServerFn(updateTriageDraft);
  const aiStatusFn = useServerFn(getAiStatus);

  const aiStatusQ = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => aiStatusFn(),
  });

  const issuesQ = useQuery({
    queryKey: ["issues", selected?.id],
    queryFn: () => fetchIssuesFn({ data: { repository_id: selected!.id } }),
    enabled: !!selected,
  });

  const triageQ = useQuery({
    queryKey: ["triage", selected?.id],
    queryFn: () => listTriageFn({ data: { repository_id: selected!.id } }),
    enabled: !!selected,
  });

  const [q, setQ] = useState("");
  const [state, setState] = useState<StateFilter>("all");
  const [labelFilter, setLabelFilter] = useState<string>("all");
  const [authorFilter, setAuthorFilter] = useState<string>("all");
  const [staleOnly, setStaleOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("updated");
  const [analyzing, setAnalyzing] = useState<Set<string>>(() => new Set<string>());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const issues = issuesQ.data?.issues ?? [];
  const triageRows = (triageQ.data?.triage ?? []) as TriageRow[];
  const triageByIssue = useMemo(() => {
    const map = new Map<string, TriageRow>();
    for (const t of triageRows) map.set(t.issue_id, t);
    return map;
  }, [triageRows]);

  const { labels, authors } = useMemo(() => {
    const ls = new Set<string>();
    const as = new Set<string>();
    for (const i of issues) {
      for (const l of (i.labels as IssueLabel[] | null) ?? []) if (l?.name) ls.add(l.name);
      if (i.author_login) as.add(i.author_login);
    }
    return { labels: Array.from(ls).sort(), authors: Array.from(as).sort() };
  }, [issues]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = issues.filter((i) => {
      if (state !== "all" && i.state !== state) return false;
      if (labelFilter !== "all" && !((i.labels as IssueLabel[] | null) ?? []).some((l) => l?.name === labelFilter)) return false;
      if (authorFilter !== "all" && i.author_login !== authorFilter) return false;
      if (staleOnly && !isStale(i.updated_at)) return false;
      if (needle) {
        const hay = `${i.title} #${i.number} ${i.author_login ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    const ts = (s: string | null) => (s ? new Date(s).getTime() : 0);
    list.sort((a, b) => {
      if (sort === "newest") return ts(b.created_at) - ts(a.created_at);
      if (sort === "oldest") return ts(a.created_at) - ts(b.created_at);
      if (sort === "comments") return (b.comments ?? 0) - (a.comments ?? 0);
      return ts(b.updated_at) - ts(a.updated_at);
    });
    return list;
  }, [issues, q, state, labelFilter, authorFilter, staleOnly, sort]);

  const aiConfigured = aiStatusQ.data?.configured ?? false;

  async function runTriage(issueId: string, reanalyze = false) {
    if (!aiConfigured) {
      toast.error("AI is not configured. Add LOVABLE_API_KEY to enable triage.");
      return;
    }
    setAnalyzing((prev) => {
      const next = new Set(prev);
      next.add(issueId);
      return next;
    });
    try {
      await triageFn({ data: { issue_id: issueId, reanalyze } });
      await qc.invalidateQueries({ queryKey: ["triage", selected?.id] });
    } catch (err) {
      toast.error((err as Error).message ?? "Triage failed");
    } finally {
      setAnalyzing((prev) => {
        const next = new Set(prev);
        next.delete(issueId);
        return next;
      });
    }
  }

  async function runBulk() {
    if (!aiConfigured) { toast.error("AI is not configured."); return; }
    const targets = filtered.filter((i) => !triageByIssue.has(i.id));
    if (targets.length === 0) { toast.message("All visible issues are already analyzed."); return; }
    const ok = window.confirm(
      `Analyze ${targets.length} visible issues with AI? This will use AI gateway credits. Run sequentially.`,
    );
    if (!ok) return;
    setBulkRunning(true);
    setBulkProgress({ done: 0, total: targets.length });
    for (let i = 0; i < targets.length; i++) {
      try { await runTriage(targets[i].id, false); }
      catch { /* surfaced via toast */ }
      setBulkProgress({ done: i + 1, total: targets.length });
    }
    setBulkRunning(false);
    toast.success("Bulk triage complete");
  }

  const selectedIssue = useMemo(
    () => (selectedIssueId ? issues.find((i) => i.id === selectedIssueId) ?? null : null),
    [selectedIssueId, issues],
  );
  const selectedTriage = selectedIssueId ? triageByIssue.get(selectedIssueId) ?? null : null;

  const header = (
    <PageHeader
      title="Issues"
      description="Triage live GitHub issues with editable AI drafts. Nothing is posted to GitHub."
      actions={
        <>
          {selected && issues.length > 0 && <DataSourceBadge variant="live" />}
          <RepoSelector />
          {selected && <SyncNowButton repositoryId={selected.id} />}
        </>
      }
    />
  );

  if (reposLoading) {
    return <div>{header}<div className="panel rounded-xl p-10 text-center text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin inline mr-2" />Loading repositories…</div></div>;
  }
  if (!hasConnectedRepo) {
    return <div>{header}<EmptyRepositoryState /></div>;
  }

  return (
    <div>
      {header}

      {!aiConfigured && !aiStatusQ.isLoading && (
        <div className="panel rounded-xl border border-warning/40 bg-warning/5 p-3 mb-4 text-sm flex items-start gap-2">
          <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-warning">AI triage is not configured</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Add a <code className="font-mono">LOVABLE_API_KEY</code> server secret to enable AI issue triage. The Analyze buttons are disabled in the meantime.
            </p>
          </div>
        </div>
      )}

      <div className="panel rounded-xl p-3 mb-4 flex flex-col md:flex-row md:items-center gap-2">
        <div className="relative flex-1">
          <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, number, author…"
            className="w-full pl-8 pr-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <Select value={state} onChange={(v) => setState(v as StateFilter)} options={[["all","All states"],["open","Open"],["closed","Closed"]]} />
        <Select value={labelFilter} onChange={setLabelFilter} options={[["all","All labels"], ...labels.map((l) => [l, l] as [string,string])]} />
        <Select value={authorFilter} onChange={setAuthorFilter} options={[["all","All authors"], ...authors.map((a) => [a, a] as [string,string])]} />
        <Select value={sort} onChange={(v) => setSort(v as SortKey)} options={[["updated","Recently updated"],["newest","Newest"],["oldest","Oldest"],["comments","Most commented"]]} />
        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground px-2">
          <input type="checkbox" className="accent-primary" checked={staleOnly} onChange={(e) => setStaleOnly(e.target.checked)} />
          Stale (&gt;60d)
        </label>
        <button
          onClick={runBulk}
          disabled={!aiConfigured || bulkRunning || filtered.length === 0}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {bulkRunning ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
          {bulkRunning ? `Analyzing ${bulkProgress.done}/${bulkProgress.total}…` : "Analyze visible"}
        </button>
      </div>

      {issuesQ.isLoading ? (
        <div className="panel rounded-xl p-10 text-center text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin inline mr-2" />Loading issues…</div>
      ) : issues.length === 0 ? (
        <EmptySyncedDataState repositoryId={selected!.id} resource="issues" />
      ) : (
        <div className="panel rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>{filtered.length} of {issues.length} issues</span>
            <span>{triageRows.length} analyzed</span>
          </div>
          <ul>
            {filtered.map((i) => {
              const ils = (i.labels as IssueLabel[] | null) ?? [];
              const t = triageByIssue.get(i.id);
              const isAnalyzing = analyzing.has(i.id);
              const status: string = isAnalyzing ? "analyzing" : t ? "analyzed" : "not analyzed";
              return (
                <li key={i.id} className="px-4 py-3 border-b border-border last:border-0 hover:bg-accent/30 cursor-pointer"
                  onClick={() => setSelectedIssueId(i.id)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">#{i.number}</span>
                    <Chip className={i.state === "open" ? "border-success/30 bg-success/10 text-success" : "border-muted bg-muted text-muted-foreground"}>{i.state}</Chip>
                    {isStale(i.updated_at) && <Chip className="border-warning/30 bg-warning/10 text-warning">stale</Chip>}
                    <span className="text-sm font-medium truncate">{i.title}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>{i.author_login ?? "unknown"}</span>
                    {i.updated_at && <span>· updated {formatDistanceToNow(new Date(i.updated_at), { addSuffix: true })}</span>}
                    <span className="inline-flex items-center gap-1"><MessageSquare className="size-3" />{i.comments ?? 0}</span>
                    {ils.slice(0, 3).map((l) => (
                      <span key={l.name} className="rounded-full border border-border bg-surface px-1.5 py-0.5 text-[10px]">{l.name}</span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <Chip className={
                      status === "analyzed" ? "border-success/30 bg-success/10 text-success" :
                      status === "analyzing" ? "border-primary/30 bg-primary/10 text-primary" :
                      "border-border bg-surface text-muted-foreground"
                    }>
                      {status === "analyzing" && <Loader2 className="size-2.5 animate-spin inline mr-1" />}
                      {status}
                    </Chip>
                    {t && (
                      <>
                        <Chip className="border-border bg-surface text-foreground">type: {t.result.issueType}</Chip>
                        <Chip className={severityClass[t.result.severity] ?? severityClass.unknown}>severity: {t.result.severity}</Chip>
                        <Chip className="border-border bg-surface text-foreground">priority: {t.result.priority}</Chip>
                        <Chip className="border-border bg-surface text-muted-foreground">confidence: {Math.round((t.result.confidence ?? 0) * 100)}%</Chip>
                        <Chip className="border-primary/30 bg-primary/10 text-primary">AI draft</Chip>
                      </>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); runTriage(i.id, !!t); }}
                      disabled={!aiConfigured || isAnalyzing}
                      className="ml-auto inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11px] hover:bg-accent disabled:opacity-50"
                    >
                      {isAnalyzing ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                      {t ? "Reanalyze" : "Analyze"}
                    </button>
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">No issues match the current filters.</li>}
          </ul>
        </div>
      )}

      {selectedIssue && (
        <TriagePanel
          issue={selectedIssue}
          triage={selectedTriage}
          onClose={() => setSelectedIssueId(null)}
          onAnalyze={() => runTriage(selectedIssue.id, !!selectedTriage)}
          analyzing={analyzing.has(selectedIssue.id)}
          aiConfigured={aiConfigured}
          onUpdate={async (payload) => {
            await updateTriageFn({ data: payload });
            await qc.invalidateQueries({ queryKey: ["triage", selected?.id] });
          }}
        />
      )}
    </div>
  );
}

function TriagePanel({
  issue, triage, onClose, onAnalyze, analyzing, aiConfigured, onUpdate,
}: {
  issue: { id: string; number: number; title: string };
  triage: TriageRow | null;
  onClose: () => void;
  onAnalyze: () => void;
  analyzing: boolean;
  aiConfigured: boolean;
  onUpdate: (payload: { triage_id: string; suggested_reply?: string; approval_status?: "pending"|"approved"|"edited"|"rejected"; action?: "approve"|"edit"|"reject"|"copy" }) => Promise<void>;
}) {
  const [reply, setReply] = useState(triage?.suggested_reply ?? "");
  const [editing, setEditing] = useState(false);
  useEffect(() => { setReply(triage?.suggested_reply ?? ""); setEditing(false); }, [triage?.id, triage?.suggested_reply]);

  const r = triage?.result;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <aside className="relative z-10 h-full w-full max-w-xl overflow-y-auto border-l border-border bg-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Issue #{issue.number}</div>
            <h2 className="text-sm font-semibold truncate">{issue.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-accent"><X className="size-4" /></button>
        </div>

        <div className="p-4 space-y-4">
          {!triage ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              <Sparkles className="size-5 inline mb-2 text-primary" />
              <p>This issue has not been analyzed yet.</p>
              <button
                onClick={onAnalyze}
                disabled={!aiConfigured || analyzing}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                {analyzing ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                Generate AI draft
              </button>
              {!aiConfigured && <p className="mt-2 text-[11px] text-warning">AI is not configured.</p>}
            </div>
          ) : (
            r && (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <Chip className="border-primary/30 bg-primary/10 text-primary">AI draft · {triage.model}</Chip>
                <Chip className="border-border bg-surface text-muted-foreground">status: {triage.approval_status}</Chip>
              </div>

              <Section title="Summary"><p className="text-sm">{r.summary || "—"}</p></Section>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Type" value={r.issueType} />
                <Field label="Severity" value={r.severity} />
                <Field label="Priority" value={r.priority} />
                <Field label="Complexity" value={r.complexity} />
                <Field label="Confidence" value={`${Math.round(r.confidence * 100)}%`} />
                <Field label="Duplicate likelihood" value={`${Math.round(r.duplicateLikelihood * 100)}%`} />
                <Field label="Sentiment" value={r.sentiment} />
                <Field label="Action needed" value={r.maintainerActionNeeded ? "Yes" : "No"} />
              </div>

              {r.suggestedLabels.length > 0 && (
                <Section title="Suggested labels">
                  <div className="flex flex-wrap gap-1.5">
                    {r.suggestedLabels.map((l) => <span key={l} className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px]">{l}</span>)}
                  </div>
                </Section>
              )}

              <Section title="Recommended next action">
                <p className="text-sm">{r.recommendedNextAction || "—"}</p>
              </Section>

              <Section title="Suggested maintainer reply (editable draft)">
                <textarea
                  value={reply}
                  onChange={(e) => { setReply(e.target.value); setEditing(true); }}
                  rows={8}
                  className="w-full rounded-md border border-border bg-background p-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">AI draft. Review before sharing. MaintainerOS does not post to GitHub automatically.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button onClick={async () => {
                    await navigator.clipboard.writeText(reply);
                    toast.success("Reply copied to clipboard");
                    await onUpdate({ triage_id: triage.id, action: "copy" });
                  }} className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs hover:bg-accent">
                    <Copy className="size-3" /> Copy reply
                  </button>
                  <button onClick={async () => {
                    await onUpdate({ triage_id: triage.id, suggested_reply: reply, approval_status: editing ? "edited" : "approved", action: editing ? "edit" : "approve" });
                    toast.success(editing ? "Draft saved as edited" : "Draft approved");
                  }} className="inline-flex items-center gap-1 rounded-md border border-success/40 bg-success/10 text-success px-2.5 py-1.5 text-xs hover:bg-success/15">
                    {editing ? <Pencil className="size-3" /> : <Check className="size-3" />} {editing ? "Save edit" : "Approve draft"}
                  </button>
                  <button onClick={async () => {
                    await onUpdate({ triage_id: triage.id, approval_status: "rejected", action: "reject" });
                    toast.message("Draft rejected");
                  }} className="inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-2.5 py-1.5 text-xs hover:bg-destructive/15">
                    <XCircle className="size-3" /> Reject draft
                  </button>
                </div>
              </Section>

              {r.riskNotes.length > 0 && <Section title="Risk notes"><ul className="list-disc pl-5 text-sm space-y-1">{r.riskNotes.map((n, i) => <li key={i}>{n}</li>)}</ul></Section>}
              {r.safetyNotes.length > 0 && <Section title="Safety notes (review recommended)"><ul className="list-disc pl-5 text-sm space-y-1 text-warning">{r.safetyNotes.map((n, i) => <li key={i}>{n}</li>)}</ul></Section>}

              <button onClick={onAnalyze} disabled={!aiConfigured || analyzing} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50">
                {analyzing ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />} Reanalyze
              </button>
            </>
            )
          )}
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-0.5 capitalize">{value}</div>
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
