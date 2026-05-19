import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Check, Github, Loader2 } from "lucide-react";
import { useSelectedRepo } from "@/hooks/use-selected-repo";
import { cn } from "@/lib/utils";

export function RepoSelector() {
  const [open, setOpen] = useState(false);
  const { repos, selected, select, isLoading } = useSelectedRepo();

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" /> Loading repos…
      </div>
    );
  }

  if (!selected) {
    return (
      <Link
        to="/onboarding"
        className="inline-flex items-center gap-2 rounded-md border border-border bg-surface hover:bg-surface-elevated transition-colors px-2.5 py-1.5 text-sm"
      >
        <Github className="size-3.5 text-muted-foreground" />
        Connect a repository
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-border bg-surface hover:bg-surface-elevated transition-colors px-2.5 py-1.5 text-sm"
      >
        <Github className="size-3.5 text-muted-foreground" />
        <span className="font-medium">{selected.full_name}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1.5 w-72 rounded-lg border border-border bg-popover shadow-xl p-1">
            {repos.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  select(r.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left flex items-start gap-2 rounded-md px-2 py-2 hover:bg-accent",
                  selected.id === r.id && "bg-accent",
                )}
              >
                <Github className="size-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.full_name}</div>
                  {r.description && (
                    <div className="text-xs text-muted-foreground truncate">{r.description}</div>
                  )}
                </div>
                {selected.id === r.id && <Check className="size-4 text-primary" />}
              </button>
            ))}
            <div className="mt-1 border-t border-border pt-1">
              <Link
                to="/onboarding"
                className="block w-full text-left rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent"
              >
                + Connect another repository
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
