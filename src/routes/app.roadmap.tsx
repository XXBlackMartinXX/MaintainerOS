import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, DemoBadge, AIBadge } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { roadmapClusters } from "@/lib/demo-data";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/app/roadmap")({ component: RoadmapPage });

function RoadmapPage() {
  return (
    <div>
      <PageHeader
        title="Roadmap Planner"
        description="AI clusters open issues by theme. Promote a cluster to a milestone with one click."
        actions={<DemoBadge />}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roadmapClusters.map((c) => (
          <div key={c.key} className="panel rounded-xl p-5 flex flex-col">
            <div className="flex items-center gap-2">
              <AIBadge />
              <h3 className="font-medium">{c.title}</h3>
            </div>
            <div className="mt-3 text-3xl font-semibold tabular-nums">{c.count}</div>
            <p className="text-xs text-muted-foreground mt-1">{c.hint}</p>
            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" variant="outline">
                View issues
              </Button>
              <Button size="sm">
                <Plus className="size-3.5" /> Create milestone
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
