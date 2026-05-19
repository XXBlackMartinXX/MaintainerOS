import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Activity,
  Inbox,
  GitPullRequest,
  FileText,
  Users,
  BookOpen,
  ShieldAlert,
  ShieldCheck,
  Map,
  History,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/health", label: "Repo Health", icon: Activity },
  { to: "/app/issues", label: "Issue Triage", icon: Inbox },
  { to: "/app/pulls", label: "Pull Requests", icon: GitPullRequest },
  { to: "/app/changelog", label: "Changelog", icon: FileText },
  { to: "/app/contributors", label: "Contributors", icon: Users },
  { to: "/app/docs", label: "Documentation", icon: BookOpen },
  { to: "/app/security", label: "Security", icon: ShieldAlert },
  { to: "/app/moderation", label: "Moderation", icon: ShieldCheck },
  { to: "/app/roadmap", label: "Roadmap", icon: Map },
  { to: "/app/actions", label: "AI Action Log", icon: History },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <Link to="/" className="flex items-center gap-2 px-5 h-14 border-b border-sidebar-border">
        <div className="size-7 rounded-md bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/30">
          <Sparkles className="size-4" />
        </div>
        <span className="font-semibold tracking-tight text-sidebar-foreground">
          MaintainerOS
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/80 transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active ? "text-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3 text-xs text-sidebar-foreground/70">
        <div className="flex items-center gap-1.5 font-medium text-sidebar-foreground">
          <span className="inline-block size-1.5 rounded-full bg-warning" />
          Demo mode
        </div>
        <p className="mt-1 leading-relaxed">
          Showing illustrative data. Connect GitHub to load your real repositories.
        </p>
      </div>
    </aside>
  );
}
