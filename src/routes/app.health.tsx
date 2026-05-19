import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui-bits";
import { RepoSelector } from "@/components/repo-selector";
import { DataSourceBadge } from "@/components/data-source-badge";
import { SyncNowButton } from "@/components/sync-now-button";
import { EmptyRepositoryState, EmptySyncedDataState } from "@/components/empty-states";
import { useSelectedRepo } from "@/hooks/use-selected-repo";
import { getRepoHealthInputs } from "@/lib/github.functions";

export const Route = createFileRoute("/app/health")({ component: HealthPage });

type Inputs = {
  issues: { state: string; created_at: string | null; updated_at: string | null; closed_at: string | null; comments: number }[];
  pulls: { state: string; created_at: string | null; updated_at: string | null; merged_at: string | null; closed_at: string | null; draft: boolean | null }[];
  contributors: { login: string; contributions: number }[];
  labels: { name: string }[];
  commits: { committed_at: string | null }[];
};

type ScoreRow = {
  key: string;
  score: number;
  weight: number;
  rationale: string;
  missing?: boolean;
};

function daysAgo(s: string | null) {
  if (!s) return Infinity;
  return (Date.now() - new Date(s).getTime()) / 86_400_000;
}

function computeScores(d: Inputs): { rows: ScoreRow[]; total: number; recommendations: string[] } {
  const openIssues = d.issues.filter((i) => i.state === "open");
  const staleIssues = openIssues.filter((i) => daysAgo(i.updated_at) > 60);
  const issueFreshness = openIssues.length === 0
    ? 100
    : Math.max(0, 100 - Math.round((staleIssues.length / openIssues.length) * 100));

  const openPRs = d.pulls.filter((p) => p.state === "open");
  const stalePRs = openPRs.filter((p) => daysAgo(p.updated_at) > 30);
  const prFreshness = openPRs.length === 0
    ? 100
    : Math.max(0, 100 - Math.round((stalePRs.length / openPRs.length) * 100));

  const labelCount = d.labels.length;
  const docsCompleteness = Math.min(100, 40 + labelCount * 6);

  const recentCommits = d.commits.filter((c) => daysAgo(c.committed_at) < 30).length;
  const maintainerActivity = Math.min(100, recentCommits * 10);

  const securityReadiness = labelCount > 0 && d.commits.length > 0 ? 70 : 50;
  const releaseReadiness = d.pulls.filter((p) => p.merged_at && daysAgo(p.merged_at) < 60).length > 0 ? 75 : 55;

  const rows: ScoreRow[] = [
    { key: "Issue freshness", score: issueFreshness, weight: 0.2,
      rationale: `${openIssues.length} open · ${staleIssues.length} stale (>60d).` },
    { key: "PR freshness", score: prFreshness, weight: 0.2,
      rationale: `${openPRs.length} open PRs · ${stalePRs.length} stale (>30d).` },
    { key: "Documentation coverage", score: docsCompleteness, weight: 0.15,
      rationale: `${labelCount} labels defined. Heuristic only — README/CONTRIBUTING are not yet inspected.`,
      missing: labelCount === 0 },
    { key: "Maintainer activity", score: maintainerActivity, weight: 0.2,
      rationale: `${recentCommits} commits in the last 30 days.` },
    { key: "Security readiness", score: securityReadiness, weight: 0.15,
      rationale: "Heuristic baseline. Security advisories and dependency scans are not yet wired in.",
      missing: true },
    { key: "Release readiness", score: releaseReadiness, weight: 0.1,
      rationale: "Based on recently merged PRs. Release tagging signal not yet wired in.",
      missing: true },
  ];

  const total = Math.round(rows.reduce((acc, r) => acc + r.score * r.weight, 0));

  const recommendations: string[] = [];
  if (staleIssues.length > 0)
    recommendations.push(`Triage ${staleIssues.length} stale issue${staleIssues.length === 1 ? "" : "s"} older than 60 days.`);
  if (stalePRs.length > 0)
    recommendations.push(`Review ${stalePRs.length} stale PR${stalePRs.length === 1 ? "" : "s"}.`);
  if (labelCount < 5)
    recommendations.push("Add a small core label set (bug, enhancement, docs, good-first-issue, question) to make triage faster.");
  if (recentCommits === 0)
    recommendations.push("Consider a maintenance pass — no commits in the last 30 days.");

  return { rows, total, recommendations };
}

function HealthPage() {
  const { selected, hasConnectedRepo, isLoading: reposLoading } = useSelectedRepo();
  const fn = useServerFn(getRepoHealthInputs);
  const q = useQuery({
    queryKey: ["health", selected?.id],
    queryFn: () => fn({ data: { repository_id: selected!.id } }),
    enabled: !!selected,
  });

  const hasData =
    q.data &&
    (q.data.issues.length + q.data.pulls.length + q.data.contributors.length + q.data.commits.length) > 0;

  const computed = q.data ? computeScores(q.data as Inputs) : null;
  const anyMissing = computed?.rows.some((r) => r.missing);

  const header = (
    <PageHeader
      title="Repo health"
      description="A weighted score across signals that matter for sustainable open source. All scoring is transparent and shown below."
      actions={
        <>
          {selected && hasData && (
            <DataSourceBadge variant={anyMissing ? "partial" : "live"} />
          )}
          <RepoSelector />
          {selected && <SyncNowButton repositoryId={selected.id} />}
        </>
      }
    />
  );

  if (reposLoading)
    return <div>{header}<Loading /></div>;
  if (!hasConnectedRepo)
    return <div>{header}<EmptyRepositoryState /></div>;
  if (q.isLoading)
    return <div>{header}<Loading label="Loading health inputs…" /></div>;
  if (!hasData)
    return <div>{header}<EmptySyncedDataState repositoryId={selected!.id} resource="health data" /></div>;

  const total = computed!.total;
  const totalColor = total >= 80 ? "text-success" : total >= 60 ? "text-warning" : "text-destructive";

  return (
    <div>
      {header}

      <div className="panel-elevated rounded-xl p-6 mb-4 flex items-center gap-6">
        <div className="grid place-items-center size-24 rounded-full border-4 border-border">
          <span className={`text-3xl font-bold tabular-nums ${totalColor}`}>{total}</span>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold tracking-tight">Overall health score</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Computed from synced GitHub data. Some signals are partial — see the breakdown for details.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {computed!.rows.map((r) => (
          <div key={r.key} className="panel rounded-xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{r.key}</h3>
              <div className="flex items-center gap-2">
                {r.missing && <DataSourceBadge variant="partial" label="Partial signal" />}
                <span className={`tabular-nums text-lg font-semibold ${
                  r.score >= 80 ? "text-success" : r.score >= 60 ? "text-warning" : "text-destructive"
                }`}>{r.score}</span>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  r.score >= 80 ? "bg-success" : r.score >= 60 ? "bg-warning" : "bg-destructive"
                }`}
                style={{ width: `${r.score}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{r.rationale}</p>
            <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              Weight: {Math.round(r.weight * 100)}%
            </p>
          </div>
        ))}
      </div>

      {computed!.recommendations.length > 0 && (
        <div className="mt-6 panel rounded-xl p-5">
          <h3 className="text-sm font-medium">Recommended actions</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {computed!.recommendations.map((r) => (
              <li key={r} className="rounded-md border border-border bg-surface px-3 py-2">{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 panel rounded-xl p-4 text-xs text-muted-foreground flex items-start gap-2">
        <ShieldAlert className="size-3.5 mt-0.5 shrink-0" />
        <p>
          Security readiness is a heuristic baseline only. MaintainerOS does not yet inspect security
          advisories or dependency vulnerabilities — we say <em>review recommended</em>, never that a repo
          is secure or insecure.
        </p>
      </div>
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
