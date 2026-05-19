import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shield, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { PageHeader } from "@/components/ui-bits";
import { RepoSelector } from "@/components/repo-selector";
import { DataSourceBadge } from "@/components/data-source-badge";
import { SyncNowButton } from "@/components/sync-now-button";
import { EmptyRepositoryState, EmptySyncedDataState } from "@/components/empty-states";
import { useSelectedRepo } from "@/hooks/use-selected-repo";
import { fetchContributors } from "@/lib/github.functions";

export const Route = createFileRoute("/app/contributors")({ component: ContributorsPage });

function ContributorsPage() {
  const { selected, hasConnectedRepo, isLoading: reposLoading } = useSelectedRepo();
  const fn = useServerFn(fetchContributors);
  const q = useQuery({
    queryKey: ["contributors", selected?.id],
    queryFn: () => fn({ data: { repository_id: selected!.id } }),
    enabled: !!selected,
  });

  const contributors = q.data?.contributors ?? [];
  const top = [...contributors].sort((a, b) => b.contributions - a.contributions);

  const header = (
    <PageHeader
      title="Contributor insights"
      description="Project-health signals about contribution activity — never judgments about people."
      actions={
        <>
          {selected && contributors.length > 0 && <DataSourceBadge variant="live" />}
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

      <div className="panel-elevated rounded-xl p-4 mb-4 flex items-start gap-3 text-sm">
        <Shield className="size-4 mt-0.5 text-info shrink-0" />
        <p className="text-muted-foreground leading-relaxed">
          <span className="text-foreground font-medium">Privacy promise.</span>{" "}
          MaintainerOS never infers sensitive personal traits and does not rank
          contributors in a hostile way. These insights focus on activity volume
          and onboarding quality.
        </p>
      </div>

      {q.isLoading ? (
        <Loading label="Loading contributors…" />
      ) : contributors.length === 0 ? (
        <EmptySyncedDataState repositoryId={selected!.id} resource="contributors" />
      ) : (
        <>
          <div className="panel rounded-xl p-4 mb-4">
            <h3 className="text-sm font-medium mb-3">Contribution distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={top.slice(0, 15).map((c) => ({ name: c.login, value: c.contributions }))}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} angle={-25} textAnchor="end" height={60} interval={0} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.014 260)",
                    border: "1px solid oklch(0.27 0.013 260)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="panel rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-medium">Top contributors</h3>
              <span className="text-xs text-muted-foreground">{contributors.length} total</span>
            </div>
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left font-normal px-4 py-2">Contributor</th>
                  <th className="text-right font-normal px-4 py-2">Contributions</th>
                </tr>
              </thead>
              <tbody>
                {top.map((c) => (
                  <tr key={c.login} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 flex items-center gap-2">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt="" className="size-6 rounded-full" />
                      ) : (
                        <div className="size-6 rounded-full bg-muted" />
                      )}
                      <span className="font-medium">{c.login}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.contributions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
