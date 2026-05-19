import { healthBreakdown } from "@/lib/demo-data";

function scoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

export function HealthScoreCard({ score = healthBreakdown.overall }: { score?: number }) {
  const radius = 36;
  const c = 2 * Math.PI * radius;
  const offset = c - (score / 100) * c;

  return (
    <div className="panel-elevated rounded-xl p-5 flex items-center gap-5">
      <div className="relative size-24 shrink-0">
        <svg viewBox="0 0 100 100" className="size-24 -rotate-90">
          <circle cx="50" cy="50" r={radius} className="fill-none stroke-border" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="fill-none stroke-primary"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className={`text-2xl font-semibold tabular-nums ${scoreColor(score)}`}>{score}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Health</div>
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">Repo health score</div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Weighted across issues, PRs, docs, security, and community signals.
        </p>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {healthBreakdown.categories.slice(0, 3).map((c) => (
            <div key={c.key} className="rounded-md border border-border px-2 py-1.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {c.key}
              </div>
              <div className={`text-sm font-medium tabular-nums ${scoreColor(c.score)}`}>
                {c.score}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
