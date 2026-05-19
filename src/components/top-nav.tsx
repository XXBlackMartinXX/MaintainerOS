import { Link } from "@tanstack/react-router";
import { Bell, Github, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopNav() {
  return (
    <header className="h-14 shrink-0 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
      <div className="h-full flex items-center gap-3 px-4 md:px-6">
        <button className="hidden md:flex items-center gap-2 text-sm text-muted-foreground rounded-md border border-border/70 bg-surface px-2.5 py-1.5 w-72 hover:border-border-strong transition-colors">
          <Search className="size-3.5" />
          <span>Jump to issue, PR, repo…</span>
          <kbd className="ml-auto text-[10px] rounded bg-muted px-1.5 py-0.5 font-mono">⌘K</kbd>
        </button>

        <div className="md:hidden font-semibold text-sm">MaintainerOS</div>

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="ghost" asChild className="hidden sm:inline-flex">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Github className="size-4" />
            </a>
          </Button>
          <Button size="sm" variant="ghost" className="text-muted-foreground">
            <Bell className="size-4" />
          </Button>
          <Link
            to="/app/settings"
            className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1 text-sm hover:bg-surface-elevated transition-colors"
          >
            <div className="size-6 rounded-full bg-gradient-to-br from-primary/60 to-info/60" />
            <span className="hidden sm:inline">maintainer</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </header>
  );
}
