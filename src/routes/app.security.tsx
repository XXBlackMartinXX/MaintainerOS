import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Circle,
  MinusCircle,
  Loader2,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { PageHeader, AIBadge } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { RepoSelector } from "@/components/repo-selector";
import { DataSourceBadge } from "@/components/data-source-badge";
import { EmptyRepositoryState } from "@/components/empty-states";
import { useSelectedRepo } from "@/hooks/use-selected-repo";
import {
  generateDocumentation,
  listDocumentationDrafts,
  getRepoReadiness,
  getDocsAiStatus,
} from "@/lib/docs.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/app/security")({ component: SecurityPage });

type Status = "ok" | "review" | "missing" | "not_configured";

function StatusBadge({ s }: { s: Status }) {
  const map: Record<Status, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
    ok: {
      label: "Looks ready",
      cls: "border-success/30 bg-success/10 text-success",
      Icon: CheckCircle2,
    },
    review: {
      label: "Review recommended",
      cls: "border-warning/30 bg-warning/10 text-warning",
      Icon: AlertTriangle,
    },
    missing: { label: "Missing data", cls: "border-info/30 bg-info/10 text-info", Icon: Circle },
    not_configured: {
      label: "Not configured",
      cls: "border-border bg-muted text-muted-foreground",
      Icon: MinusCircle,
    },
  };
  const v = map[s];
  const Icon = v.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${v.cls}`}
    >
      <Icon className="size-3" />
      {v.label}
    </span>
  );
}

function SecurityPage() {
  const { selected, isLoading: repoLoading, hasConnectedRepo } = useSelectedRepo();
  const readinessFn = useServerFn(getRepoReadiness);
  const aiStatusFn = useServerFn(getDocsAiStatus);
  const listFn = useServerFn(listDocumentationDrafts);
  const generateFn = useServerFn(generateDocumentation);
  const queryClient = useQueryClient();

  const readinessQ = useQuery({
    queryKey: ["readiness", selected?.id],
    queryFn: () => readinessFn({ data: { repository_id: selected!.id } }),
    enabled: !!selected,
  });
  const aiStatusQ = useQuery({ queryKey: ["docs-ai-status"], queryFn: () => aiStatusFn() });
  const secDraftsQ = useQuery({
    queryKey: ["docs-drafts-security", selected?.id],
    queryFn: () => listFn({ data: { repository_id: selected!.id, doc_type: "security" } }),
    enabled: !!selected,
  });

  const [copied, setCopied] = useState(false);
  const securityDraft = secDraftsQ.data?.drafts?.[0] ?? null;

  const genMut = useMutation({
    mutationFn: () => generateFn({ data: { repository_id: selected!.id, doc_type: "security" } }),
    onSuccess: () => {
      toast.success("Security guidance draft generated");
      queryClient.invalidateQueries({ queryKey: ["docs-drafts-security", selected?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (repoLoading)
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin inline mr-2" />
        Loading…
      </div>
    );
  if (!hasConnectedRepo) {
    return (
      <div>
        <PageHeader
          title="Security Readiness"
          description="Practical security readiness signals — cautious by design."
        />
        <EmptyRepositoryState />
      </div>
    );
  }

  const r = readinessQ.data;
  const syncDays = r?.syncFreshDays ?? null;
  const writeScope = r?.hasWriteScope ?? false;

  const checks: Array<{ key: string; label: string; status: Status; detail: string }> = [
    {
      key: "security_md",
      label: "SECURITY.md presence",
      status: "missing",
      detail:
        "MaintainerOS cannot read repository file contents in this slice. Generate a draft below and copy it manually.",
    },
    {
      key: "deps",
      label: "Dependency metadata availability",
      status: "missing",
      detail: "Dependency manifest scanning is not yet wired up. Treat this as a TODO.",
    },
    {
      key: "release_cadence",
      label: "Release cadence",
      status: "missing",
      detail: "Release feed not synced yet. Cadence cannot be evaluated.",
    },
    {
      key: "stale_critical",
      label: "Stale critical issues",
      status: "missing",
      detail:
        "AI triage severity is used when available. Open Issue Triage to mark critical items.",
    },
    {
      key: "security_labeled",
      label: "Open security-labeled issues",
      status: "missing",
      detail: "Sync labels and re-check from the Issues page.",
    },
    {
      key: "responsible_disclosure",
      label: "Responsible disclosure guidance",
      status: securityDraft?.approval_status === "approved" ? "ok" : "review",
      detail: securityDraft
        ? "AI-generated SECURITY.md draft exists."
        : "No approved security policy draft yet.",
    },
    {
      key: "code_owners",
      label: "Code owner / reviewer guidance",
      status: "missing",
      detail: "CODEOWNERS file inspection not yet implemented.",
    },
    {
      key: "write_actions",
      label: "Public write-action safety status",
      status: writeScope ? "review" : "not_configured",
      detail: writeScope
        ? "GitHub write scope is granted. Publishing remains explicit, approval-gated, duplicate-protected, and audited."
        : "No GitHub write scope. AI drafts can be copied manually but not published.",
    },
    {
      key: "ai_safety",
      label: "AI publishing safety status",
      status: "ok",
      detail: "All AI outputs require explicit approval. No auto-posting. Tokens are never logged.",
    },
    {
      key: "sync_freshness",
      label: "Recent sync freshness",
      status:
        syncDays === null ? "missing" : syncDays <= 1 ? "ok" : syncDays <= 7 ? "review" : "missing",
      detail:
        syncDays === null
          ? "No successful sync recorded yet."
          : `Last sync finished ${syncDays} day${syncDays === 1 ? "" : "s"} ago.`,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Security Readiness"
        description='Practical "security readiness signals" — not a vulnerability scanner. We never claim a project is secure or insecure.'
        actions={
          <div className="flex items-center gap-2">
            <DataSourceBadge variant="partial" />
            <RepoSelector />
          </div>
        }
      />

      <div className="panel rounded-xl">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <ShieldCheck className="size-4 text-info" />
          <h3 className="text-sm font-medium">Readiness checks</h3>
        </div>
        <ul>
          {checks.map((c) => (
            <li
              key={c.key}
              className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm">{c.label}</span>
                  <StatusBadge s={c.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 panel rounded-xl p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              AI security guidance draft
              {securityDraft && (
                <AIBadge
                  confidence={
                    (securityDraft.structured_result as { confidence?: number } | null)?.confidence
                  }
                />
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Optional AI-drafted security policy outline, responsible disclosure process, supported
              versions placeholder, maintainer response checklist, dependency review checklist,
              release security checklist, cautious risk notes. Editable and copy-only in this slice
              — nothing is committed to GitHub.
            </p>
          </div>
          <Button
            size="sm"
            disabled={!aiStatusQ.data?.configured || genMut.isPending || !selected}
            onClick={() => genMut.mutate()}
          >
            {genMut.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {securityDraft ? "Regenerate" : "Generate guidance"}
          </Button>
        </div>

        {securityDraft && (
          <div className="mt-3">
            <pre className="w-full max-h-[400px] overflow-auto rounded-md border border-border bg-background p-3 text-[11px] font-mono whitespace-pre-wrap text-foreground/90">
              {securityDraft.body_markdown}
            </pre>
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(securityDraft.body_markdown);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                Copy Markdown
              </Button>
              <Link to="/app/docs" className="text-xs text-primary hover:underline">
                Edit in Documentation Generator →
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 panel rounded-xl p-4 flex items-start gap-3 text-sm">
        <ShieldAlert className="size-4 mt-0.5 text-warning shrink-0" />
        <p className="text-muted-foreground leading-relaxed">
          MaintainerOS uses cautious language like{" "}
          <span className="text-foreground">"review recommended"</span> and
          <span className="text-foreground"> "missing data"</span>. We do{" "}
          <span className="text-foreground">not</span> say a repository is "secure" or "insecure" —
          those words require evidence we don't have access to.
        </p>
      </div>
    </div>
  );
}
