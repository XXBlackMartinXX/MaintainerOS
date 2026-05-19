import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, DemoBadge } from "@/components/ui-bits";
import { demoContributors } from "@/lib/demo-data";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/app/contributors")({
  component: ContributorsPage,
});

function ContributorsPage() {
  const top = [...demoContributors].sort((a, b) => b.contributions - a.contributions);
  return (
    <div>
      <PageHeader
        title="Contributor Insights"
        description="Project-health signals about contribution patterns — never about people."
        actions={<DemoBadge />}
      />

      <div className="panel-elevated rounded-xl p-4 mb-4 flex items-start gap-3 text-sm">
        <Shield className="size-4 mt-0.5 text-info shrink-0" />
        <p className="text-muted-foreground leading-relaxed">
          <span className="text-foreground font-medium">Privacy promise.</span> MaintainerOS never infers
          sensitive personal traits and does not rank contributors in a hostile way. These insights focus
          on project health and onboarding quality.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 panel rounded-xl p-4">
          <h3 className="text-sm font-medium mb-3">Contributions (last 90 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={top.map((c) => ({ name: c.username, value: c.contributions }))}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} />
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

        <div className="panel rounded-xl">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium">First-time contributors</h3>
          </div>
          <ul>
            {top
              .filter((c) => c.status === "first-time")
              .map((c) => (
                <li key={c.username} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                  <div className="size-7 rounded-full bg-gradient-to-br from-primary/50 to-info/50" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{c.username}</div>
                    <div className="text-xs text-muted-foreground">Joined {c.firstSeen}</div>
                  </div>
                  <span className="text-xs rounded-full border border-primary/30 bg-primary/10 text-primary px-2 py-0.5">
                    new
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 panel rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium">All contributors</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="text-left font-normal px-4 py-2">Contributor</th>
              <th className="text-left font-normal px-4 py-2">Status</th>
              <th className="text-right font-normal px-4 py-2">Contributions</th>
              <th className="text-left font-normal px-4 py-2">First seen</th>
            </tr>
          </thead>
          <tbody>
            {top.map((c) => (
              <tr key={c.username} className="border-b border-border last:border-0">
                <td className="px-4 py-3 flex items-center gap-2">
                  <div className="size-6 rounded-full bg-gradient-to-br from-primary/40 to-info/40" />
                  <span className="font-medium">{c.username}</span>
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{c.status}</td>
                <td className="px-4 py-3 text-right tabular-nums">{c.contributions}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.firstSeen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
