import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, DemoBadge } from "@/components/ui-bits";
import { demoAILog } from "@/lib/demo-data";

export const Route = createFileRoute("/app/actions")({ component: ActionsPage });

function statusClass(s: string) {
  switch (s) {
    case "approved":
    case "published":
      return "text-success";
    case "rejected":
      return "text-destructive";
    case "edited":
      return "text-warning";
    default:
      return "text-muted-foreground";
  }
}

function ActionsPage() {
  return (
    <div>
      <PageHeader
        title="AI Action Log"
        description="Every AI draft, approval, edit, rejection, and published output — fully auditable."
        actions={<DemoBadge />}
      />
      <div className="panel rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="text-left font-normal px-4 py-2">When</th>
              <th className="text-left font-normal px-4 py-2">Repo</th>
              <th className="text-left font-normal px-4 py-2">Action</th>
              <th className="text-left font-normal px-4 py-2">Target</th>
              <th className="text-left font-normal px-4 py-2">Model</th>
              <th className="text-left font-normal px-4 py-2">User</th>
              <th className="text-left font-normal px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {demoAILog.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-muted-foreground">{a.ts}</td>
                <td className="px-4 py-3 font-mono text-xs">{a.repo}</td>
                <td className="px-4 py-3">{a.action}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.target}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.model}</td>
                <td className="px-4 py-3">{a.user}</td>
                <td className={`px-4 py-3 capitalize ${statusClass(a.status)}`}>{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
