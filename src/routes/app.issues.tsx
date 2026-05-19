import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import { Search, MessageSquare, Loader2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/ui-bits";
import { RepoSelector } from "@/components/repo-selector";
import { DataSourceBadge } from "@/components/data-source-badge";
import { SyncNowButton } from "@/components/sync-now-button";
import { EmptyRepositoryState, EmptySyncedDataState } from "@/components/empty-states";
import { useSelectedRepo } from "@/hooks/use-selected-repo";
import { fetchIssues } from "@/lib/github.functions";

export const Route = createFileRoute("/app/issues")({ component: IssuesPage });

type SortKey = "updated" | "newest" | "oldest" | "comments";
type StateFilter = "all" | "open" | "closed";

type IssueLabel = { name: string; color?: string | null };

function isStale(updatedAt: string | null) {
  if (!updatedAt) return false;
  const days = (Date.now() - new Date(updatedAt).getTime()) / 86_400_000;
  return days > 60;
}

function IssuesPage() {
  const { selected, hasConnectedRepo, isLoading: reposLoading } = useSelectedRepo();
  const fn = useServerFn(fetchIssues);
  const issuesQ = useQuery({
    queryKey: ["issues", selected?.id],
    queryFn: () => fn({ data: { repository_id: selected!.id } }),
    enabled: !!selected,
  });

  const [q, setQ] = useState("");
  const [state, setState] = useState<StateFilter>("all");
  const [labelFilter, setLabelFilter] = useState<string>("all");
  const [authorFilter, setAuthorFilter] = useState<string>("all");
  const [staleOnly, setStaleOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("updated");

  const issues = issuesQ.data?.issues ?? [];

  const { labels, authors } = useMemo(() => {
    const ls = new Set<string>();
    const as = new Set<string>();
    for (const i of issues) {
      for (const l of (i.labels as IssueLabel[] | null) ?? []) {
        if (l?.name) ls.add(l.name);
      }
      if (i.author_login) as.add(i.author_login);
    }
    return { labels: Array.from(ls).sort(), authors: Array.from(as).sort() };
  }, [issues]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = issues.filter((i) => {
      if (state !== "all" && i.state !== state) return false;
      if (
        labelFilter !== "all" &&
        !((i.labels as IssueLabel[] | null) ?? []).some((l) => l?.name === labelFilter)
      )
        return false;
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

  const header = (
    <PageHeader
      title="Issues"
      description="Triage live GitHub issues for the selected repository."
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
    return (
      <div>
        {header}
        <div className="panel rounded-xl p-10 text-center text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin inline mr-2" /> Loading repositories…
        </div>
      </div>
    );
  }

  if (!hasConnectedRepo) {
    return (
      <div>
        {header}
        <EmptyRepositoryState />
      </div>
    );
  }

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
        <Select value={state} onChange={(v) => setState(v as StateFilter)}
          options={[["all","All states"],["open","Open"],["closed","Closed"]]} />
        <Select value={labelFilter} onChange={setLabelFilter}
          options={[["all","All labels"], ...labels.map((l) => [l, l] as [string,string])]} />
        <Select value={authorFilter} onChange={setAuthorFilter}
          options={[["all","All authors"], ...authors.map((a) => [a, a] as [string,string])]} />
        <Select value={sort} onChange={(v) => setSort(v as SortKey)}
          options={[["updated","Recently updated"],["newest","Newest"],["oldest","Oldest"],["comments","Most commented"]]} />
        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground px-2">
          <input type="checkbox" className="accent-primary" checked={staleOnly} onChange={(e) => setStaleOnly(e.target.checked)} />
          Stale (&gt;60d)
        </label>
      </div>

      {issuesQ.isLoading ? (
        <div className="panel rounded-xl p-10 text-center text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin inline mr-2" /> Loading issues…
        </div>
      ) : issues.length === 0 ? (
        <EmptySyncedDataState repositoryId={selected!.id} resource="issues" />
      ) : (
        <div className="panel rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>{filtered.length} of {issues.length} issues</span>
          </div>
          <ul>
            {filtered.map((i) => {
              const ils = (i.labels as IssueLabel[] | null) ?? [];
              return (
                <li key={i.id} className="px-4 py-3 border-b border-border last:border-0 hover:bg-accent/30">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">#{i.number}</span>
                    <span className={`text-[10px] rounded border px-1.5 py-0.5 font-medium capitalize ${
                      i.state === "open"
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-muted bg-muted text-muted-foreground"
                    }`}>{i.state}</span>
                    {isStale(i.updated_at) && (
                      <span className="text-[10px] rounded border border-warning/30 bg-warning/10 text-warning px-1.5 py-0.5">stale</span>
                    )}
                    <Link
                      to="/app/issues"
                      className="text-sm font-medium hover:underline truncate"
                    >
                      {i.title}
                    </Link>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>{i.author_login ?? "unknown"}</span>
                    {i.created_at && (
                      <span>opened {formatDistanceToNow(new Date(i.created_at), { addSuffix: true })}</span>
                    )}
                    {i.updated_at && (
                      <span>· updated {formatDistanceToNow(new Date(i.updated_at), { addSuffix: true })}</span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="size-3" /> {i.comments ?? 0}
                    </span>
                    {ils.slice(0, 4).map((l) => (
                      <span key={l.name} className="rounded-full border border-border bg-surface px-1.5 py-0.5 text-[10px]">
                        {l.name}
                      </span>
                    ))}
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                No issues match the current filters.
              </li>
            )}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground inline-flex items-center gap-1">
        <ExternalLink className="size-3" /> Live data synced from GitHub via your connected account.
      </p>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  );
}
