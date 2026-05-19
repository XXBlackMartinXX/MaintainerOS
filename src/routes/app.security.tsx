import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, DemoBadge, SeverityPill } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { securityAlerts } from "@/lib/demo-data";
import { ShieldAlert, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/app/security")({ component: SecurityPage });

function SecurityPage() {
  return (
    <div>
      <PageHeader
        title="Security Center"
        description="Potential risks, surfaced with uncertainty language. Review recommended before acting."
        actions={<DemoBadge />}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="panel rounded-xl p-4">
          <div className="text-xs text-muted-foreground">Open alerts</div>
          <div className="mt-2 text-2xl font-semibold">3</div>
        </div>
        <div className="panel rounded-xl p-4">
          <div className="text-xs text-muted-foreground">Policy files present</div>
          <div className="mt-2 text-2xl font-semibold text-success">2 / 3</div>
        </div>
        <div className="panel rounded-xl p-4">
          <div className="text-xs text-muted-foreground">Dependencies to review</div>
          <div className="mt-2 text-2xl font-semibold text-warning">2</div>
        </div>
      </div>

      <div className="panel rounded-xl">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <ShieldAlert className="size-4 text-warning" />
          <h3 className="text-sm font-medium">Alerts</h3>
        </div>
        <ul>
          {securityAlerts.map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{a.title}</span>
                  <SeverityPill level={a.severity} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">Dismiss</Button>
                <Button size="sm">Review</Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 panel rounded-xl p-4 flex items-start gap-3 text-sm">
        <ShieldCheck className="size-4 mt-0.5 text-info shrink-0" />
        <p className="text-muted-foreground leading-relaxed">
          Security analysis uses cautious language like <span className="text-foreground">"potential risk"</span> and
          <span className="text-foreground"> "review recommended"</span>. MaintainerOS does not claim a vulnerability
          exists without supporting data.
        </p>
      </div>
    </div>
  );
}
