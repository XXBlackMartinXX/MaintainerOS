import { Info, AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "info" | "warning" | "danger";

/**
 * Compact, screen-reader-friendly advisory banner used on trust /
 * security / readiness / health surfaces to make the advisory nature
 * of the checks visible.
 *
 * This component is intentionally presentation-only. It does not gate
 * any behavior and never claims a guarantee.
 */
export function AdvisoryNotice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const map = {
    info: {
      Icon: Info,
      cls: "border-info/30 bg-info/10 text-info",
    },
    warning: {
      Icon: AlertTriangle,
      cls: "border-warning/30 bg-warning/10 text-warning",
    },
    danger: {
      Icon: ShieldAlert,
      cls: "border-destructive/30 bg-destructive/10 text-destructive",
    },
  } as const;
  const { Icon, cls } = map[tone];
  return (
    <div
      role="note"
      aria-live="polite"
      className={cn("rounded-md border p-3 text-xs flex items-start gap-2", cls, className)}
    >
      <Icon className="size-3.5 mt-0.5 flex-none" aria-hidden />
      <div className="min-w-0">
        <div className="font-medium">{title}</div>
        {children && <div className="mt-1 text-foreground/80">{children}</div>}
      </div>
    </div>
  );
}
