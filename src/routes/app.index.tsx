import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Inbox,
  GitPullRequest,
  Users,
  Clock,
  ShieldAlert,
  Rocket,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { MetricCard, PageHeader, AIBadge, SeverityPill } from "@/components/ui-bits";
import { HealthScoreCard } from "@/components/health-score-card";
import { RepoSelector } from "@/components/repo-selector";
import { SyncStatusCard } from "@/components/sync-status-card";
import { DataSourceBadge } from "@/components/data-source-badge";
import { EmptyRepositoryState } from "@/components/empty-states";
import { useSelectedRepo } from "@/hooks/use-selected-repo";
import {
  demoIssueVolume,
  demoMergeTime,
  demoContributorActivity,
  demoLabelDistribution,
  demoAILog,
  securityAlerts,
} from "@/lib/demo-data";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const CHART_COLORS = ["#34d399", "#60a5fa", "#fbbf24", "#a78bfa", "#f87171"];

function Dashboard() {
  const { selected, hasConnectedRepo } = useSelectedRepo();
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live sync status for the selected repository, plus preview charts that will become live as more data is wired up."
        actions={<RepoSelector />}
      />

      {hasConnectedRepo ? (
        <div className="mb-6">
          <SyncStatusCard repo={selected} />
        </div>
      ) : (
        <div className="mb-6">
          <EmptyRepositoryState />
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold tracking-tight">Activity preview</h2>
        <DataSourceBadge variant="demo" />
        <span className="text-xs text-muted-foreground">
          These cards use illustrative numbers — wiring to live data is in progress.
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <MetricCard
          label="Open issues"
          value={47}
          delta={{ value: "+6 wk", positive: false }}
          icon={Inbox}
        />
        <MetricCard
          label="Active PRs"
          value={12}
          delta={{ value: "+2 wk", positive: true }}
          icon={GitPullRequest}
        />
        <MetricCard label="Stale issues" value={5} hint=">60 days" icon={Clock} />
        <MetricCard
          label="New contributors"
          value={3}
          delta={{ value: "+1 wk", positive: true }}
          icon={Users}
        />
        <MetricCard
          label="Avg PR merge"
          value="19h"
          delta={{ value: "−5h", positive: true }}
          icon={Rocket}
        />
        <MetricCard
          label="Security alerts"
          value={3}
          hint="Review recommended"
          icon={ShieldAlert}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <HealthScoreCard />
        </div>
        <div className="panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Release readiness</h3>
            <span className="text-xs text-muted-foreground">v0.9.0 draft</span>
          </div>
          <div className="mt-4 text-3xl font-semibold tabular-nums text-warning">
            68<span className="text-base text-muted-foreground"> / 100</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            2 PRs awaiting review block readiness. 9 merged PRs ready for changelog.
          </p>
          <Link
            to="/app/changelog"
            className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Draft release notes <Sparkles className="size-3" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Issue volume" subtitle="Opened vs closed, last 8 weeks">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={demoIssueVolume}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="opened" stroke="#34d399" fill="url(#g1)" />
              <Area type="monotone" dataKey="closed" stroke="#60a5fa" fill="url(#g2)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="PR merge time" subtitle="Median hours to merge">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={demoMergeTime}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#fbbf24"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Contributor activity" subtitle="Last 7 days">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={demoContributorActivity}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="commits" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="prs" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              <Bar dataKey="reviews" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Label distribution" subtitle="Open issues by label">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={demoLabelDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {demoLabelDistribution.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel rounded-xl">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-medium">Recent AI actions</h3>
            <Link to="/app/actions" className="text-xs text-primary hover:underline">
              View log
            </Link>
          </div>
          <ul>
            {demoAILog.slice(0, 5).map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
              >
                <AIBadge />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">
                    {a.action} · <span className="font-mono text-muted-foreground">{a.target}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {a.repo} · {a.ts}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground capitalize">{a.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel rounded-xl">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-medium">Security alerts</h3>
            <Link to="/app/security" className="text-xs text-primary hover:underline">
              Security center
            </Link>
          </div>
          <ul>
            {securityAlerts.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0"
              >
                <AlertTriangle className="size-4 mt-0.5 text-warning shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{a.title}</span>
                    <SeverityPill level={a.severity} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "oklch(0.21 0.014 260)",
  border: "1px solid oklch(0.27 0.013 260)",
  borderRadius: 8,
  fontSize: 12,
};

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-medium">{title}</h3>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}
