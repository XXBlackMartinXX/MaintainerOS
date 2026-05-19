import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import { Github, Inbox, GitPullRequest, Users, Tag, AlertTriangle } from "lucide-react";
import { getLatestSync } from "@/lib/github.functions";
import { SyncNowButton } from "@/components/sync-now-button";
import { DataSourceBadge } from "@/components/data-source-badge";
import type { ConnectedRepo } from "@/hooks/use-selected-repo";

function StatusPill({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    success: "bg-success/10 text-success border-success/30",
    running: "bg-info/10 text-info border-info/30",
    pending: "bg-muted text-muted-foreground border-border",
    error: "bg-destructive/10 text-destructive border-destructive/30",
  };
  const label = status ?? "idle";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${
        map[label] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label === "running" ? "Syncing" : label}
    </span>
  );
}

function Stat({
  label,
  value,
  Icon,
}: {
  label: string;
  value: number;
  Icon: typeof Inbox;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-3" />
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function SyncStatusCard({ repo }: { repo: ConnectedRepo | null }) {
  const fn = useServerFn(getLatestSync);
  const { data, isLoading } = useQuery({
    queryKey: ["sync", repo?.id],
    queryFn: () => fn({ data: { repository_id: repo!.id } }),
    enabled: !!repo,
    refetchInterval: (q) =>
      (q.state.data?.job?.status === "running" || q.state.data?.job?.status === "pending")
        ? 3_000
        : false,
  });

  const job = data?.job ?? null;
  const rateLimited =
    !!job?.error && /rate.?limit|secondary rate/i.test(job.error);

  return (
    <div className="panel-elevated rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="size-9 rounded-md bg-surface border border-border grid place-items-center shrink-0">
            <Github className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold tracking-tight truncate">
                {repo ? repo.full_name : "No repository selected"}
              </h2>
              <StatusPill status={job?.status ?? null} />
              {job?.status === "success" && !job.error && (
                <DataSourceBadge variant="live" />
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {repo
                ? job?.finished_at
                  ? `Last synced ${formatDistanceToNow(new Date(job.finished_at), { addSuffix: true })}`
                  : isLoading
                    ? "Loading sync status…"
                    : "Never synced. Run a sync to pull GitHub data."
                : "Connect a repository to enable sync."}
            </p>
          </div>
        </div>
        <SyncNowButton repositoryId={repo?.id ?? null} />
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Issues" value={job?.issues_synced ?? 0} Icon={Inbox} />
        <Stat label="Pull requests" value={job?.prs_synced ?? 0} Icon={GitPullRequest} />
        <Stat label="Contributors" value={job?.contributors_synced ?? 0} Icon={Users} />
        <Stat label="Labels" value={job?.labels_synced ?? 0} Icon={Tag} />
      </div>

      {job?.error && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
          <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">
              {rateLimited ? "GitHub rate limit reached" : "Last sync error"}
            </div>
            <div className="opacity-90 mt-0.5 break-words">{job.error}</div>
          </div>
        </div>
      )}
    </div>
  );
}
