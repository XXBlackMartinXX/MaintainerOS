import { AlertTriangle, X } from "lucide-react";
import { useDemoMode } from "@/hooks/use-demo-mode";

export function DemoBanner() {
  const { enabled, setDemo } = useDemoMode();
  if (!enabled) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs text-warning"
    >
      <AlertTriangle className="size-3.5 shrink-0" />
      <span className="font-medium">Demo mode active.</span>
      <span className="text-warning/80 hidden sm:inline">
        All repositories, issues, PRs and AI outputs shown are illustrative sample data.
        Publishing and GitHub sync are disabled.
      </span>
      <button
        onClick={() => setDemo(false)}
        className="ml-auto inline-flex items-center gap-1 rounded border border-warning/30 px-2 py-0.5 text-[11px] hover:bg-warning/10"
      >
        <X className="size-3" /> Exit demo
      </button>
    </div>
  );
}
