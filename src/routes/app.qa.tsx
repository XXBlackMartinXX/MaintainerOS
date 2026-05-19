import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui-bits";
import { CheckSquare, Square } from "lucide-react";

export const Route = createFileRoute("/app/qa")({
  component: QAPage,
  head: () => ({ meta: [{ title: "QA Checklist — MaintainerOS" }] }),
});

const ITEMS = [
  ["github-oauth", "GitHub OAuth configured (Client ID/Secret in Supabase Auth providers)"],
  ["supabase-migrations", "Supabase migrations applied"],
  ["rls", "RLS enabled on all user-data tables"],
  ["sync", "GitHub sync tested against a real repository"],
  ["ai-gateway", "Lovable AI Gateway configured (LOVABLE_API_KEY present)"],
  ["triage", "Issue triage tested end-to-end"],
  ["pr-summary", "PR summaries tested end-to-end"],
  ["changelog", "Changelog draft tested end-to-end"],
  ["docs", "Documentation draft tested end-to-end"],
  ["write", "GitHub write actions tested in a test repository"],
  ["demo", "Demo mode labels visible everywhere"],
  ["readme", "README reviewed"],
  ["no-fake-metrics", "No fake metrics or testimonials"],
  ["no-secrets", "No secrets committed to the repository"],
] as const;

const KEY = "mos.qa.checklist";

function load(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function QAPage() {
  const [state, setState] = useState<Record<string, boolean>>({});
  useEffect(() => setState(load()), []);
  const toggle = (id: string) => {
    const next = { ...state, [id]: !state[id] };
    setState(next);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  };
  const done = Object.values(state).filter(Boolean).length;

  return (
    <div>
      <PageHeader
        title="QA Checklist"
        description="Internal pre-launch checklist for MaintainerOS maintainers. Stored locally in your browser."
      />
      <div className="panel rounded-xl p-2">
        <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border">
          {done} of {ITEMS.length} checked
        </div>
        <ul className="divide-y divide-border">
          {ITEMS.map(([id, label]) => {
            const checked = !!state[id];
            return (
              <li key={id}>
                <button
                  onClick={() => toggle(id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent/40"
                >
                  {checked ? (
                    <CheckSquare className="size-4 text-primary" />
                  ) : (
                    <Square className="size-4 text-muted-foreground" />
                  )}
                  <span className={checked ? "line-through text-muted-foreground" : ""}>
                    {label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
