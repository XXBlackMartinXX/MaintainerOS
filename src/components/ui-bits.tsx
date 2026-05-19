import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function MetricCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  delta?: { value: string; positive?: boolean };
  hint?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="panel rounded-xl p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="uppercase tracking-wider font-medium">{label}</span>
        {Icon && <Icon className="size-3.5" />}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        {delta && (
          <span
            className={cn(
              "text-xs inline-flex items-center gap-0.5",
              delta.positive ? "text-success" : "text-destructive"
            )}
          >
            {delta.positive ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {delta.value}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
      <span className="size-1.5 rounded-full bg-warning" />
      Demo data
    </span>
  );
}

export function AIBadge({ confidence }: { confidence?: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-info/30 bg-info/10 px-1.5 py-0.5 text-[10px] font-medium text-info">
      AI draft
      {typeof confidence === "number" && (
        <span className="opacity-70">· {Math.round(confidence * 100)}%</span>
      )}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel rounded-xl p-10 text-center">
      <div className="mx-auto size-10 rounded-full bg-muted grid place-items-center">
        <div className="size-2 rounded-full bg-muted-foreground/60" />
      </div>
      <h3 className="mt-3 font-medium">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SeverityPill({
  level,
}: {
  level: "low" | "medium" | "high" | "critical";
}) {
  const map = {
    low: "bg-muted text-muted-foreground border-border",
    medium: "bg-info/10 text-info border-info/30",
    high: "bg-warning/10 text-warning border-warning/30",
    critical: "bg-destructive/15 text-destructive border-destructive/30",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium capitalize",
        map[level]
      )}
    >
      {level}
    </span>
  );
}
