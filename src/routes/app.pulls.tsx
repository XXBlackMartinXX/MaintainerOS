import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import {
  Search,
  Loader2,
  GitMerge,
  GitPullRequest,
  AlertTriangle,
  Sparkles,
  X,
  Check,
  Copy,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { RepoSelector } from "@/components/repo-selector";
import { DataSourceBadge } from "@/components/data-source-badge";
import { SyncNowButton } from "@/components/sync-now-button";
import { EmptyRepositoryState, EmptySyncedDataState } from "@/components/empty-states";
import { useSelectedRepo } from "@/hooks/use-selected-repo";
import { fetchPulls } from "@/lib/github.functions";
import {
  summarizePullRequest,
  listPrSummariesForRepo,
  updatePrSummaryDraft,
} from "@/lib/ai-pr.functions";
import {
  publishPrSummary,
  formatPrSummaryComment,
  getGithubWritePermissions,
  listPublishEventsForSource,
} from "@/lib/github-publish.functions";
import { PublishConfirmDialog } from "@/components/publish-confirm-dialog";
import {
  AlreadyPublishedNotice,
  GitHubPermissionWarning,
  PublishStatusBadge,
  getPublishEventForSource,
  type PublishEvent,
} from "@/components/publish-helpers";
import { Send } from "lucide-react";

export const Route = createFileRoute("/app/pulls")({ component: PullsPage });

type SortKey = "updated" | "newest" | "oldest" | "size";
type StateFilter = "all" | "open" | "closed" | "merged";

type SummaryRow = {
  id: string;
  pull_request_id: string;
  model: string;
  result: Record<string, unknown>;
  release_note_candidate: string | null;
  approval_status: string;
  updated_at: string;
};

function PullsPage() {
  const { selected, hasConnectedRepo, isLoading: reposLoading } = useSelectedRepo();
  const qc = useQueryClient();
  const fetchPullsFn = useServerFn(fetchPulls);
  const listFn = useServerFn(listPrSummariesForRepo);
  const summarizeFn = useServerFn(summarizePullRequest);
  const updateFn = useServerFn(updatePrSummaryDraft);
  const permsFn = useServerFn(getGithubWritePermissions);
  const publishFn = useServerFn(publishPrSummary);
  const listEventsFn = useServerFn(listPublishEventsForSource);

  const permsQ = useQuery({ queryKey: ["github-perms"], queryFn: () => permsFn() });

  const pullsQ = useQuery({
    queryKey: ["pulls", selected?.id],
    queryFn: () => fetchPullsFn({ data: { repository_id: selected!.id } }),
    enabled: !!selected,
  });
  const summariesQ = useQuery({
    queryKey: ["pr-summaries", selected?.id],
    queryFn: () => listFn({ data: { repository_id: selected!.id } }),
    enabled: !!selected,
  });

  const [q, setQ] = useState("");
  const [state, setState] = useState<StateFilter>("all");
  const [sort, setSort] = useState<SortKey>("updated");
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  const pulls = pullsQ.data?.pulls ?? [];
  const summaries = (summariesQ.data?.summaries ?? []) as SummaryRow[];
  const summaryByPr = useMemo(() => {
    const m = new Map<string, SummaryRow>();
    for (const s of summaries) m.set(s.pull_request_id, s);
    return m;
  }, [summaries]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = pulls.filter((p) => {
      if (state === "merged" && !p.merged_at) return false;
      if (state === "open" && p.state !== "open") return false;
      if (state === "closed" && (p.state !== "closed" || p.merged_at)) return false;
      if (needle) {
        const hay = `${p.title} #${p.number} ${p.author_login ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    const ts = (s: string | null) => (s ? new Date(s).getTime() : 0);
    list.sort((a, b) => {
      if (sort === "newest") return ts(b.created_at) - ts(a.created_at);
      if (sort === "oldest") return ts(a.created_at) - ts(b.created_at);
      if (sort === "size")
        return (b.additions ?? 0) + (b.deletions ?? 0) - ((a.additions ?? 0) + (a.deletions ?? 0));
      return ts(b.updated_at) - ts(a.updated_at);
    });
    return list;
  }, [pulls, q, state, sort]);

  async function analyzeOne(prId: string, reanalyze = false) {
    setAnalyzingId(prId);
    try {
      await summarizeFn({ data: { pull_request_id: prId, reanalyze } });
      await qc.invalidateQueries({ queryKey: ["pr-summaries", selected?.id] });
      toast.success("AI draft summary generated");
    } catch (err) {
      toast.error((err as Error).message || "AI summary failed");
    } finally {
      setAnalyzingId(null);
    }
  }

  async function analyzeVisible(reanalyze: boolean) {
    if (!filtered.length) return;
    if (
      !window.confirm(
        `Generate AI draft summaries for ${filtered.length} visible PR${filtered.length === 1 ? "" : "s"}?\n\nThis runs on the server and uses AI credits. Drafts are editable and never auto-posted to GitHub.`,
      )
    )
      return;
    setBulkProgress({ done: 0, total: filtered.length });
    let ok = 0;
    let fail = 0;
    let skipped = 0;
    for (let i = 0; i < filtered.length; i++) {
      const pr = filtered[i];
      const has = summaryByPr.get(pr.id);
      if (has && !reanalyze) {
        skipped++;
      } else {
        try {
          await summarizeFn({ data: { pull_request_id: pr.id, reanalyze } });
          ok++;
        } catch {
          fail++;
        }
      }
      setBulkProgress({ done: i + 1, total: filtered.length });
    }
    setBulkProgress(null);
    await qc.invalidateQueries({ queryKey: ["pr-summaries", selected?.id] });
    toast.success(`Bulk done: ${ok} analyzed, ${skipped} skipped, ${fail} failed`);
  }

  const selectedSummary = selectedId ? summaryByPr.get(selectedId) ?? null : null;
  const selectedPr = selectedId ? pulls.find((p) => p.id === selectedId) ?? null : null;

  const header = (
    <PageHeader
      title="Pull requests"
      description="Live PR activity + AI-drafted review summaries. Drafts are editable; nothing is posted to GitHub."
      actions={
        <>
          {selected && pulls.length > 0 && <DataSourceBadge variant="live" />}
          <RepoSelector />
          {selected && <SyncNowButton repositoryId={selected.id} />}
        </>
      }
    />
  );

  if (reposLoading)
    return (
      <div>
        {header}
        <Loading />
      </div>
    );
  if (!hasConnectedRepo)
    return (
      <div>
        {header}
        <EmptyRepositoryState />
      </div>
    );

  return (
    <div>
      {header}

      <div className="panel rounded-xl p-3 mb-4 flex flex-col md:flex-row md:items-center gap-2">
        <div className="relative flex-1">
          <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, number, author…"
            className="w-full pl-8 pr-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={state}
          onChange={(e) => setState(e.target.value as StateFilter)}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
        >
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="merged">Merged</option>
          <option value="closed">Closed (not merged)</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
        >
          <option value="updated">Recently updated</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="size">Largest diff</option>
        </select>
        <Button
          size="sm"
          variant="outline"
          disabled={!!bulkProgress || filtered.length === 0}
          onClick={() => analyzeVisible(false)}
        >
          {bulkProgress ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> {bulkProgress.done}/{bulkProgress.total}
            </>
          ) : (
            <>
              <Sparkles className="size-3.5" /> Analyze visible PRs
            </>
          )}
        </Button>
      </div>

      {pullsQ.isLoading ? (
        <Loading label="Loading pull requests…" />
      ) : pulls.length === 0 ? (
        <EmptySyncedDataState repositoryId={selected!.id} resource="pull requests" />
      ) : (
        <div className="panel rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-xs text-muted-foreground">
            {filtered.length} of {pulls.length} pull requests
          </div>
          <ul>
            {filtered.map((p) => {
              const merged = !!p.merged_at;
              const size = (p.additions ?? 0) + (p.deletions ?? 0);
              const summary = summaryByPr.get(p.id);
              const res = (summary?.result ?? {}) as Record<string, unknown>;
              const analyzing = analyzingId === p.id;
              const status: { label: string; cls: string } = analyzing
                ? { label: "analyzing", cls: "border-info/30 bg-info/10 text-info" }
                : summary
                  ? summary.approval_status === "approved"
                    ? { label: "approved", cls: "border-success/30 bg-success/10 text-success" }
                    : summary.approval_status === "rejected"
                      ? { label: "rejected", cls: "border-destructive/30 bg-destructive/10 text-destructive" }
                      : { label: "AI draft", cls: "border-primary/30 bg-primary/10 text-primary" }
                  : { label: "not analyzed", cls: "border-border bg-muted text-muted-foreground" };
              return (
                <li
                  key={p.id}
                  className="px-4 py-3 border-b border-border last:border-0 hover:bg-accent/30"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">#{p.number}</span>
                    <span
                      className={`text-[10px] inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${
                        merged
                          ? "border-info/30 bg-info/10 text-info"
                          : p.state === "open"
                            ? "border-success/30 bg-success/10 text-success"
                            : "border-muted bg-muted text-muted-foreground"
                      }`}
                    >
                      {merged ? <GitMerge className="size-3" /> : <GitPullRequest className="size-3" />}
                      {merged ? "merged" : p.state}
                    </span>
                    {p.draft && (
                      <span className="text-[10px] rounded border border-border px-1.5 py-0.5 text-muted-foreground">
                        draft
                      </span>
                    )}
                    {size > 800 && (
                      <span className="text-[10px] inline-flex items-center gap-1 rounded border border-warning/30 bg-warning/10 text-warning px-1.5 py-0.5">
                        <AlertTriangle className="size-3" /> large
                      </span>
                    )}
                    <span className="text-sm font-medium truncate flex-1">{p.title}</span>
                    <span className={`text-[10px] inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${status.cls}`}>
                      {status.label}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={analyzing}
                      onClick={(e) => {
                        e.stopPropagation();
                        analyzeOne(p.id, !!summary);
                      }}
                    >
                      {analyzing ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : summary ? (
                        <RefreshCw className="size-3.5" />
                      ) : (
                        <Sparkles className="size-3.5" />
                      )}
                      {summary ? "Re-analyze" : "Analyze"}
                    </Button>
                    {summary && (
                      <Button size="sm" variant="ghost" onClick={() => setSelectedId(p.id)}>
                        View
                      </Button>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>{p.author_login ?? "unknown"}</span>
                    <span className="text-success">+{p.additions ?? 0}</span>
                    <span className="text-destructive">−{p.deletions ?? 0}</span>
                    <span>· {p.changed_files ?? 0} files</span>
                    {p.created_at && (
                      <span>
                        opened {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                      </span>
                    )}
                    {summary && (
                      <>
                        <span className="text-foreground/80">· type: {String(res.changeType ?? "—")}</span>
                        <span className="text-foreground/80">· risk: {String(res.riskLevel ?? "—")}</span>
                        <span className="text-foreground/80">
                          · confidence: {Math.round(Number(res.confidence ?? 0) * 100)}%
                        </span>
                        <span className="text-foreground/80">
                          · breaking: {Math.round(Number(res.breakingChangeLikelihood ?? 0) * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                No pull requests match the current filters.
              </li>
            )}
          </ul>
        </div>
      )}

      {selectedSummary && selectedPr && (
        <SummaryPanel
          pr={selectedPr}
          summary={selectedSummary}
          perms={permsQ.data}
          onClose={() => setSelectedId(null)}
          onUpdate={async (patch) => {
            await updateFn({ data: { summary_id: selectedSummary.id, ...patch } });
            await qc.invalidateQueries({ queryKey: ["pr-summaries", selected?.id] });
          }}
          publish={async (allowRepost) =>
            publishFn({ data: { summary_id: selectedSummary.id, confirm: true, allow_repost: allowRepost } })
          }
          listEvents={(id) => listEventsFn({ data: { source_type: "pr_summary", source_id: id } })}
        />
      )}
    </div>
  );
}

function SummaryPanel({
  pr,
  summary,
  onClose,
  onUpdate,
  perms,
  publish,
  listEvents,
}: {
  pr: { id: string; number: number; title: string };
  summary: SummaryRow;
  onClose: () => void;
  onUpdate: (patch: {
    release_note_candidate?: string;
    approval_status?: "pending" | "approved" | "edited" | "rejected";
    action?: "approve" | "edit" | "reject" | "copy";
  }) => Promise<void>;
  perms?: { hasToken: boolean; canCommentPulls: boolean; scopes: string[] };
  publish: (allowRepost: boolean) => Promise<{ ok: boolean; githubUrl?: string | null; alreadyPosted?: boolean; previousUrl?: string | null }>;
  listEvents: (id: string) => Promise<{ events: PublishEvent[] }>;
}) {
  const r = summary.result as Record<string, unknown>;
  const [note, setNote] = useState(summary.release_note_candidate ?? String(r.releaseNoteCandidate ?? ""));
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [repost, setRepost] = useState(false);

  const arr = (k: string) => (Array.isArray(r[k]) ? (r[k] as string[]) : []);

  const eventsQ = useQuery({
    queryKey: ["publish-events", "pr_summary", summary.id],
    queryFn: () => listEvents(summary.id),
  });
  const event = getPublishEventForSource(eventsQ.data?.events, "success");

  const isApproved = ["approved", "edited"].includes(summary.approval_status);
  const previewMd = formatPrSummaryComment({
    plainEnglishSummary: typeof r.plainEnglishSummary === "string" ? r.plainEnglishSummary : undefined,
    suggestedReviewFocus: arr("suggestedReviewFocus"),
    testingNotes: arr("testingNotes"),
    securityNotes: arr("securityNotes"),
    missingContext: arr("missingContext"),
  });
  const canPost = isApproved && !!perms?.canCommentPulls && previewMd.trim().length > 0;

  async function act(action: "approve" | "edit" | "reject" | "copy", status?: "approved" | "edited" | "rejected") {
    setSaving(true);
    try {
      if (action === "copy") {
        await navigator.clipboard.writeText(note);
        await onUpdate({ action: "copy" });
        toast.success("Release note copied");
      } else if (action === "edit") {
        await onUpdate({ release_note_candidate: note, approval_status: "edited", action: "edit" });
        toast.success("Draft saved");
      } else {
        await onUpdate({
          release_note_candidate: note,
          approval_status: status,
          action,
        });
        toast.success(`Draft ${action}d`);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-xl bg-background border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-background z-10 px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">PR #{pr.number} · AI draft</div>
            <div className="text-sm font-medium truncate">{pr.title}</div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4 text-sm">
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <Chip>type: {String(r.changeType ?? "—")}</Chip>
            <Chip>risk: {String(r.riskLevel ?? "—")}</Chip>
            <Chip>confidence: {Math.round(Number(r.confidence ?? 0) * 100)}%</Chip>
            <Chip>breaking: {Math.round(Number(r.breakingChangeLikelihood ?? 0) * 100)}%</Chip>
            <Chip>category: {String(r.changelogCategory ?? "Unknown")}</Chip>
            <Chip>status: {summary.approval_status}</Chip>
          </div>

          <Section title="Plain-English summary">{String(r.plainEnglishSummary ?? "")}</Section>
          <Section title="Technical summary">{String(r.technicalSummary ?? "")}</Section>

          <Section title="Release note (editable)">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </Section>

          <List title="Suggested review focus" items={arr("suggestedReviewFocus")} />
          <List title="Testing notes" items={arr("testingNotes")} />
          <List title="Security notes" items={arr("securityNotes")} />
          <List title="Merge readiness notes" items={arr("mergeReadinessNotes")} />
          <List title="Suggested labels" items={arr("suggestedLabels")} />
          <List title="Missing context" items={arr("missingContext")} muted />
          <List title="Safety notes" items={arr("safetyNotes")} muted />

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <Button size="sm" disabled={saving} onClick={() => act("approve", "approved")}>
              <Check className="size-3.5" /> Approve
            </Button>
            <Button size="sm" variant="outline" disabled={saving} onClick={() => act("edit", "edited")}>
              Save edits
            </Button>
            <Button size="sm" variant="ghost" disabled={saving} onClick={() => act("reject", "rejected")}>
              Reject
            </Button>
            <Button size="sm" variant="outline" disabled={saving} onClick={() => act("copy")}>
              <Copy className="size-3.5" /> Copy release note
            </Button>
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Publish to GitHub</div>
              {event && <PublishStatusBadge status="success" />}
            </div>
            {!isApproved && <p className="text-xs text-muted-foreground">Approve or edit this summary to enable publishing.</p>}
            {isApproved && perms && !perms.canCommentPulls && (
              <GitHubPermissionWarning missing="post PR comments" hasToken={perms.hasToken} />
            )}
            {event && (
              <AlreadyPublishedNotice
                event={event}
                republishLabel="Post summary again"
                onRepublish={() => { setRepost(true); setDialogOpen(true); }}
              />
            )}
            <Button
              size="sm"
              disabled={!canPost}
              onClick={() => { setRepost(!!event); setDialogOpen(true); }}
            >
              <Send className="size-3.5" /> {event ? "Post summary again to GitHub PR" : "Post summary to GitHub PR"}
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            AI drafts are advisory. Nothing is posted to GitHub without your explicit confirmation.
          </p>

          <PublishConfirmDialog
            open={dialogOpen}
            onOpenChange={(v) => { setDialogOpen(v); if (!v) setRepost(false); }}
            kind="pr_comment"
            previousUrl={repost ? event?.github_url : null}
            preview={<pre className="whitespace-pre-wrap font-mono text-xs">{previewMd}</pre>}
            onConfirm={async () => {
              const res = await publish(repost);
              await eventsQ.refetch();
              return res;
            }}
          />
        </div>
      </aside>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5">
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{title}</div>
      <div className="text-sm whitespace-pre-wrap">{children}</div>
    </div>
  );
}

function List({ title, items, muted }: { title: string; items: string[]; muted?: boolean }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{title}</div>
      <ul className={`text-sm list-disc pl-5 space-y-0.5 ${muted ? "text-muted-foreground" : ""}`}>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="panel rounded-xl p-10 text-center text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin inline mr-2" /> {label}
    </div>
  );
}
