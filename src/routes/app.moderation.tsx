import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, DemoBadge, AIBadge } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { moderationQueue } from "@/lib/demo-data";
import { Check, X, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/app/moderation")({ component: ModerationPage });

function ModerationPage() {
  return (
    <div>
      <PageHeader
        title="Community Moderation"
        description="Spam, low-quality, and duplicate detection — as suggestions. You always have the final say."
        actions={<DemoBadge />}
      />
      <div className="panel-elevated rounded-xl p-4 mb-4 text-sm text-muted-foreground">
        MaintainerOS never auto-closes issues, hides comments, or punishes contributors. Every
        action requires your approval, and reply templates are designed to de-escalate rather than
        confront.
      </div>
      <div className="panel rounded-xl">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium">Moderation queue</h3>
          <span className="text-xs text-muted-foreground">{moderationQueue.length}</span>
        </div>
        <ul>
          {moderationQueue.map((m) => (
            <li key={m.id} className="px-4 py-3 border-b border-border last:border-0">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-muted-foreground">{m.issue}</span>
                    <span className="rounded border border-border-strong px-1.5 py-0.5 capitalize">
                      {m.kind}
                    </span>
                    <AIBadge confidence={m.confidence} />
                  </div>
                  <p className="mt-1.5 text-sm">{m.snippet}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="size-3.5" /> Reply draft
                  </Button>
                  <Button size="sm" variant="ghost" className="text-muted-foreground">
                    <X className="size-3.5" /> Ignore
                  </Button>
                  <Button size="sm">
                    <Check className="size-3.5" /> Approve
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
