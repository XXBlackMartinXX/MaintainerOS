import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ClipboardCheck, ShieldAlert, ArrowRight } from "lucide-react";
import { PageHeader, AIBadge } from "@/components/ui-bits";
import { RepoSelector } from "@/components/repo-selector";
import { DataSourceBadge } from "@/components/data-source-badge";
import { EmptyRepositoryState } from "@/components/empty-states";
import { useSelectedRepo } from "@/hooks/use-selected-repo";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { listApprovalQueue } from "@/lib/approval-queue.functions";
import {
  countsByStatus,
  filterQueue,
  sortQueue,
  type ApprovalState,
  type QueueItem,
  type QueueSource,
} from "@/lib/approval-queue/queue";

export const Route = createFileRoute("/app/approval-queue")({
  component: ApprovalQueuePage,
  head: () => ({
    meta: [
      { title: "Approval Queue — MaintainerOS" },
      {
        name: "description",
        content:
          "Central queue of pending AI drafts. Human approval is required before any GitHub publish.",
      },
    ],
  }),
});

const SOURCE_LINK: Record<QueueSource, string> = {
  issue_triage: "/app/issues",
  pr_summary: "/app/pulls",
  release_draft: "/app/changelog",
  documentation: "/app/docs",
};

const SOURCE_LABEL: Record<QueueSource, string> = {
  issue_triage: "Issue triage",
  pr_summary: "PR summary",
  release_draft: "Release draft",
  documentation: "Documentation",
};

const STATUS_CLASS: Record<ApprovalState, string> = {
  pending: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
  edited: "border-warning/30 bg-warning/10 text-warning",
  approved: "border-success/30 bg-success/10 text-success",
  published: "border-primary/30 bg-primary/10 text-primary",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
};

function ApprovalQueuePage() {
  const { selected, isLoading: repoLoading, hasConnectedRepo } = useSelectedRepo();
  const { enabled: demo } = useDemoMode();
  const fn = useServerFn(listApprovalQueue);

  const queueQ = useQuery({
    queryKey: ["approval-queue", selected?.id],
    queryFn: () => fn({ data: { repository_id: selected!.id } }),
    enabled: !!selected,
  });

  const [source, setSource] = useState<QueueSource | "all">("all");
  const [status, setStatus] = useState<ApprovalState | "all">("all");
  const [search, setSearch] = useState("");

  const allItems = useMemo<QueueItem[]>(() => queueQ.data?.items ?? [], [queueQ.data]);
  const filtered = useMemo(
    () => sortQueue(filterQueue(allItems, { source, status, search })),
    [allItems, source, status, search],
  );
  const counts = useMemo(() => countsByStatus(allItems), [allItems]);

  if (repoLoading) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin inline mr-2" />
        Loading…
      </div>
    );
  }

  if (!hasConnectedRepo) {
    return (
      <div>
        <PageHeader
          title="Approval Queue"
          description="Pending AI drafts across triage, PR summaries, releases, and documentation."
        />
        <EmptyRepositoryState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Approval Queue"
        description="Every AI-generated output requires explicit human approval. This queue summarises pending items; publishing still happens from each source page with its confirmation dialog."
        actions={
          <div className="flex items-center gap-2">
            <DataSourceBadge variant={demo ? "demo" : "live"} />
            <RepoSelector />
          </div>
        }
      />

      <div className="panel rounded-xl p-3 mb-4 flex items-start gap-3">
        <ShieldAlert className="size-4 mt-0.5 text-warning shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Human approval is required before any GitHub publish. This page shows status only —
          actions happen on the source page and go through the publish confirmation dialog.
          {demo && (
            <span className="block mt-1 text-warning">
              Demo mode is on: items shown are illustrative; publishing is disabled.
            </span>
          )}
        </p>
      </div>

      <div className="panel rounded-xl p-3 mb-4 flex items-center gap-2 flex-wrap text-xs">
        <span className="text-muted-foreground">Source:</span>
        {(["all", "issue_triage", "pr_summary", "release_draft", "documentation"] as const).map(
          (k) => (
            <button
              key={k}
              onClick={() => setSource(k)}
              className={`rounded-md border px-2 py-1 ${source === k ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface hover:bg-accent"}`}
            >
              {k === "all" ? "All" : SOURCE_LABEL[k]}
            </button>
          ),
        )}
        <span className="text-muted-foreground ml-3">Status:</span>
        {(["all", "pending", "edited", "approved", "rejected", "published", "failed"] as const).map(
          (k) => (
            <button
              key={k}
              onClick={() => setStatus(k)}
              className={`rounded-md border px-2 py-1 capitalize ${status === k ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface hover:bg-accent"}`}
            >
              {k}
            </button>
          ),
        )}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search titles…"
          className="ml-auto rounded-md border border-border bg-surface px-2 py-1 text-xs w-48"
          aria-label="Search queue items"
        />
      </div>

      <div className="panel rounded-xl p-3 mb-4 flex flex-wrap gap-3 text-xs">
        <Stat label="Pending" value={counts.pending} />
        <Stat label="Edited" value={counts.edited} />
        <Stat label="Approved" value={counts.approved} />
        <Stat label="Published" value={counts.published} />
        <Stat label="Failed" value={counts.failed} />
        <Stat label="Total" value={allItems.length} />
      </div>

      <div className="panel rounded-xl overflow-hidden">
        {queueQ.isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin inline mr-2" />
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <ClipboardCheck className="size-5 mx-auto mb-2 opacity-50" />
            No queue items match the current filters.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Source</th>
                <th className="text-left px-4 py-2 font-medium">Title</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Updated</th>
                <th className="text-left px-4 py-2 font-medium">Model</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr
                  key={`${i.source}:${i.id}`}
                  className="border-t border-border hover:bg-accent/30"
                >
                  <td className="px-4 py-2 text-xs">
                    <span className="rounded-md border border-border bg-surface px-1.5 py-0.5">
                      {SOURCE_LABEL[i.source]}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-sm">{i.title}</span>
                    {typeof i.confidence === "number" && (
                      <span className="ml-2 inline-block align-middle">
                        <AIBadge confidence={i.confidence} />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium capitalize ${STATUS_CLASS[i.approvalStatus]}`}
                    >
                      {i.approvalStatus}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(i.updatedAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{i.model ?? "—"}</td>
                  <td className="px-2 py-2">
                    <Link
                      to={SOURCE_LINK[i.source]}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap"
                      aria-label={`Open ${SOURCE_LABEL[i.source]} to review`}
                    >
                      Review <ArrowRight className="size-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        AI outputs are drafts. They are never sent to GitHub without an explicit user click and an
        in-app confirmation. Releases are always created as drafts.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
