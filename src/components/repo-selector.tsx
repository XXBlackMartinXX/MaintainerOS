import { useState } from "react";
import { ChevronDown, Check, Github } from "lucide-react";
import { demoRepos } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function RepoSelector() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(demoRepos[0]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-border bg-surface hover:bg-surface-elevated transition-colors px-2.5 py-1.5 text-sm"
      >
        <Github className="size-3.5 text-muted-foreground" />
        <span className="font-medium">{active.fullName}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 mt-1.5 w-72 rounded-lg border border-border bg-popover shadow-xl p-1">
            {demoRepos.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setActive(r);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left flex items-start gap-2 rounded-md px-2 py-2 hover:bg-accent",
                  active.id === r.id && "bg-accent"
                )}
              >
                <Github className="size-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.fullName}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.description}</div>
                </div>
                {active.id === r.id && <Check className="size-4 text-primary" />}
              </button>
            ))}
            <div className="mt-1 border-t border-border pt-1">
              <button className="w-full text-left rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent">
                + Connect another repository
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
