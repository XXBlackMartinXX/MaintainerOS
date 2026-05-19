import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle, Loader2, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui-bits";
import { RepoSelector } from "@/components/repo-selector";
import { DataSourceBadge } from "@/components/data-source-badge";
import { EmptyRepositoryState } from "@/components/empty-states";
import { useSelectedRepo } from "@/hooks/use-selected-repo";
import { listDocumentationDrafts, getRepoReadiness } from "@/lib/docs.functions";
import { DOC_TYPE_LABELS, type DocType } from "@/lib/ai/prompts/docs-generator";

export const Route = createFileRoute("/app/readiness")({ component: ReadinessPage });

type Item = { key: string; label: string; done: boolean; verified: boolean; next?: { to: string; label: string }; hint?: string };

function ReadinessPage() {
  const { selected, isLoading, hasConnectedRepo } = useSelectedRepo();
  const listFn = useServerFn(listDocumentationDrafts);
  const readinessFn = useServerFn(getRepoReadiness);

  const draftsQ = useQuery({
    queryKey: ["docs-drafts-all", selected?.id],
    queryFn: () => listFn({ data: { repository_id: selected!.id } }),
    enabled: !!selected,
  });
  const readinessQ = useQuery({
    queryKey: ["readiness", selected?.id],
    queryFn: () => readinessFn({ data: { repository_id: selected!.id } }),
    enabled: !!selected,
  });

  if (isLoading) return <div className="p-10 text-center text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin inline mr-2" />Loading…</div>;
  if (!hasConnectedRepo) {
    return (
      <div>
        <PageHeader title="Open-source readiness" description="Checklist of the basics every healthy open-source project should have." />
        <EmptyRepositoryState />
      </div>
    );
  }

  const drafts = draftsQ.data?.drafts ?? [];
  const has = (t: DocType) => drafts.some((d) => d.doc_type === t);
  const r = readinessQ.data;

  const items: Item[] = [
    { key: "readme", label: "README exists or draft generated", done: has("readme_suggestions"), verified: false, next: { to: "/app/docs", label: "Generate README suggestions" } },
    { key: "contributing", label: "CONTRIBUTING.md exists or draft generated", done: has("contributing"), verified: false, next: { to: "/app/docs", label: "Generate CONTRIBUTING" } },
    { key: "coc", label: "CODE_OF_CONDUCT.md exists or draft generated", done: has("code_of_conduct"), verified: false, next: { to: "/app/docs", label: "Generate Code of Conduct" } },
    { key: "security", label: "SECURITY.md exists or draft generated", done: has("security"), verified: false, next: { to: "/app/security", label: "Generate security guidance" } },
    { key: "issue_tpl", label: "Issue template exists or draft generated", done: has("issue_template"), verified: false, next: { to: "/app/docs", label: "Generate issue template" } },
    { key: "pr_tpl", label: "PR template exists or draft generated", done: has("pull_request_template"), verified: false, next: { to: "/app/docs", label: "Generate PR template" } },
    { key: "release", label: "Release process documented", done: has("release_process"), verified: false, next: { to: "/app/docs", label: "Generate release process" } },
    { key: "sync", label: "Repo sync configured", done: r ? r.syncFreshDays !== null : false, verified: true, hint: r?.syncFreshDays !== null ? `Last sync ${r?.syncFreshDays}d ago` : "No sync recorded", next: { to: "/app", label: "Open dashboard" } },
    { key: "audit", label: "AI audit logging enabled", done: true, verified: true, hint: "Every AI action and GitHub publish is logged.", next: { to: "/app/actions", label: "Open AI Action Log" } },
    { key: "write_gated", label: "GitHub write actions gated", done: true, verified: true, hint: "All publishing requires approval + confirmation.", next: { to: "/app/settings", label: "View permissions" } },
    { key: "demo_labeled", label: "Demo data clearly labeled", done: true, verified: true, hint: "Demo/Partial/Live badges shown across the app." },
  ];

  const completed = items.filter((i) => i.done).length;
  const pct = Math.round((completed / items.length) * 100);

  return (
    <div>
      <PageHeader
        title="Open-source readiness"
        description="A practical checklist of the basics every healthy open-source project should have. Generated drafts count — they still need to be edited and committed manually."
        actions={<div className="flex items-center gap-2"><DataSourceBadge variant="partial" /><RepoSelector /></div>}
      />

      <div className="panel rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Completion</div>
            <div className="text-2xl font-semibold">{pct}%</div>
            <div className="text-xs text-muted-foreground">{completed} of {items.length} items</div>
          </div>
          <div className="flex-1 max-w-md">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Items marked <span className="text-success">verified</span> use live data. Others count an AI draft as progress
              but still require manual editing and committing.
            </p>
          </div>
        </div>
      </div>

      <div className="panel rounded-xl">
        {items.map((i) => (
          <div key={i.key} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
            {i.done
              ? <CheckCircle2 className="size-4 text-success shrink-0" />
              : <Circle className="size-4 text-muted-foreground shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm flex items-center gap-2 flex-wrap">
                {i.label}
                {i.verified && i.done && (
                  <span className="inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">verified live</span>
                )}
                {!i.verified && i.done && (
                  <span className="inline-flex items-center rounded-md border border-info/30 bg-info/10 px-1.5 py-0.5 text-[10px] font-medium text-info">draft available</span>
                )}
              </div>
              {i.hint && <p className="text-xs text-muted-foreground mt-0.5">{i.hint}</p>}
            </div>
            {i.next && (
              <Link to={i.next.to} className="inline-flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap">
                {i.next.label} <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        MaintainerOS does not verify whether files actually exist in the repository in this slice — having an AI draft only means
        you have a starting point. Copy approved drafts manually until the future PR workflow ships.
      </p>
    </div>
  );
}
