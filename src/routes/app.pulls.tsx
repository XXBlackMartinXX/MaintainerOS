import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import { Search, Loader2, GitMerge, GitPullRequest, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui-bits";
import { RepoSelector } from "@/components/repo-selector";
import { DataSourceBadge } from "@/components/data-source-badge";
import { SyncNowButton } from "@/components/sync-now-button";
import { EmptyRepositoryState, EmptySyncedDataState } from "@/components/empty-states";
import { useSelectedRepo } from "@/hooks/use-selected-repo";
import { fetchPulls } from "@/lib/github.functions";

export const Route = createFileRoute("/app/pulls")({ component: PullsPage });

type SortKey = "updated" | "newest" | "oldest" | "size";
type StateFilter = "all" | "open" | "closed" | "merged";

function PullsPage() {
  const { selected, hasConnectedRepo, isLoading: reposLoading } = useSelectedRepo();
  const fn = useServerFn(fetchPulls);
  const pullsQ = useQuery({
    queryKey: ["pulls", selected?.id],
    queryFn: () => fn({ data: { repository_id: selected!.id } }),
    enabled: !!selected,
  });

  const [q, setQ] = useState("");
  const [state, setState] = useState<StateFilter>("all");
  const [sort, setSort] = useState<SortKey>("updated");

  const pulls = pullsQ.data?.pulls ?? [];

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
      if (sort === "size") return (b.additions ?? 0) + (b.deletions ?? 0) - ((a.additions ?? 0) + (a.deletions ?? 0));
      return ts(b.updated_at) - ts(a.updated_at);
    });
    return list;
  }, [pulls, q, state, sort]);

  const header = (
    <PageHeader
      title="Pull requests"
      description="Live PR activity for the selected repository."
      actions={
        <>
          {selected && pulls.length > 0 && <DataSourceBadge variant="live" />}
          <RepoSelector />
          {selected && <SyncNowButton repositoryId={selected.id} />}
        </>
      }
    />
  );

  if (reposLoading) return <div>{header}<Loading /></div>;
  if (!hasConnectedRepo) return <div>{header}<EmptyRepositoryState /></div>;

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
        <select value={state} onChange={(e) => setState(e.target.value as StateFilter)}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm">
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="merged">Merged</option>
          <option value="closed">Closed (not merged)</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm">
          <option value="updated">Recently updated</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="size">Largest diff</option>
        </select>
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
              const readiness = merged
                ? "merged"
                : p.draft
                  ? "draft"
                  : size > 800
                    ? "needs review (large)"
                    : "ready for review";
              return (
                <li key={p.id} className="px-4 py-3 border-b border-border last:border-0 hover:bg-accent/30">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">#{p.number}</span>
                    <span className={`text-[10px] inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${
                      merged
                        ? "border-info/30 bg-info/10 text-info"
                        : p.state === "open"
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-muted bg-muted text-muted-foreground"
                    }`}>
                      {merged ? <GitMerge className="size-3" /> : <GitPullRequest className="size-3" />}
                      {merged ? "merged" : p.state}
                    </span>
                    {p.draft && (
                      <span className="text-[10px] rounded border border-border px-1.5 py-0.5 text-muted-foreground">draft</span>
                    )}
                    {size > 800 && (
                      <span className="text-[10px] inline-flex items-center gap-1 rounded border border-warning/30 bg-warning/10 text-warning px-1.5 py-0.5">
                        <AlertTriangle className="size-3" /> large
                      </span>
                    )}
                    <span className="text-sm font-medium truncate">{p.title}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>{p.author_login ?? "unknown"}</span>
                    <span className="text-success">+{p.additions ?? 0}</span>
                    <span className="text-destructive">−{p.deletions ?? 0}</span>
                    <span>· {p.changed_files ?? 0} files</span>
                    {p.created_at && (
                      <span>opened {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                    )}
                    {p.updated_at && (
                      <span>· updated {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}</span>
                    )}
                    <span className="ml-auto text-foreground/70">readiness: {readiness}</span>
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
