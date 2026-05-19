import { cn } from "@/lib/utils";
import { CheckCircle2, FlaskConical, AlertCircle, Eye } from "lucide-react";

export type DataSourceVariant = "live" | "demo" | "partial" | "preview";

const VARIANTS: Record<
  DataSourceVariant,
  { label: string; cls: string; Icon: typeof CheckCircle2 }
> = {
  live: {
    label: "Live GitHub data",
    cls: "border-success/30 bg-success/10 text-success",
    Icon: CheckCircle2,
  },
  demo: {
    label: "Demo data",
    cls: "border-warning/30 bg-warning/10 text-warning",
    Icon: FlaskConical,
  },
  partial: {
    label: "Partial data",
    cls: "border-info/30 bg-info/10 text-info",
    Icon: AlertCircle,
  },
  preview: {
    label: "Preview only",
    cls: "border-border bg-muted text-muted-foreground",
    Icon: Eye,
  },
};

export function DataSourceBadge({
  variant,
  label,
}: {
  variant: DataSourceVariant;
  label?: string;
}) {
  const v = VARIANTS[variant];
  const Icon = v.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        v.cls,
      )}
    >
      <Icon className="size-3" />
      {label ?? v.label}
    </span>
  );
}
