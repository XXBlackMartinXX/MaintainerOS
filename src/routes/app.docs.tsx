import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import {
  FileText, Sparkles, Loader2, Copy, Check, Save, X, AlertTriangle,
  Eye, Pencil, GitPullRequest, Github,
} from "lucide-react";
import { PageHeader, AIBadge } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { DataSourceBadge } from "@/components/data-source-badge";
import { RepoSelector } from "@/components/repo-selector";
import { EmptyRepositoryState } from "@/components/empty-states";
import { useSelectedRepo } from "@/hooks/use-selected-repo";
import {
  generateDocumentation,
  listDocumentationDrafts,
  updateDocumentationDraft,
  deleteDocumentationDraft,
  getDocsAiStatus,
} from "@/lib/docs.functions";
import { DOC_TYPES, DOC_TYPE_LABELS, type DocType } from "@/lib/ai/prompts/docs-generator";
import { toast } from "sonner";

export const Route = createFileRoute("/app/docs")({ component: DocsPage });

type DraftRow = {
  id: string;
  doc_type: string;
  title: string;
  body_markdown: string;
  structured_result: Record<string, unknown> | null;
  model: string | null;
  approval_status: string;
  created_at: string;
  updated_at: string;
};

function DocsPage() {
  const { selected, isLoading: repoLoading, hasConnectedRepo } = useSelectedRepo();
  const [docType, setDocType] = useState<DocType>("readme_suggestions");
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState<string>("");
  const [editedTitle, setEditedTitle] = useState<string>("");
  const [previewMode, setPreviewMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const queryClient = useQueryClient();
  const aiStatusFn = useServerFn(getDocsAiStatus);
  const listFn = useServerFn(listDocumentationDrafts);
  const generateFn = useServerFn(generateDocumentation);
  const updateFn = useServerFn(updateDocumentationDraft);
  const deleteFn = useServerFn(deleteDocumentationDraft);

  const aiStatusQ = useQuery({ queryKey: ["docs-ai-status"], queryFn: () => aiStatusFn() });
  const draftsQ = useQuery({
    queryKey: ["docs-drafts", selected?.id, docType],
    queryFn: () => listFn({ data: { repository_id: selected!.id, doc_type: docType } }),
    enabled: !!selected,
  });

  const drafts = (draftsQ.data?.drafts ?? []) as DraftRow[];
  const activeDraft = useMemo(
    () => drafts.find((d) => d.id === activeDraftId) ?? drafts[0] ?? null,
    [drafts, activeDraftId],
  );

  useEffect(() => {
    if (activeDraft) {
      setEditedBody(activeDraft.body_markdown);
      setEditedTitle(activeDraft.title);
    } else {
      setEditedBody("");
      setEditedTitle("");
    }
  }, [activeDraft?.id]);

  const generateMut = useMutation({
    mutationFn: () => generateFn({ data: { repository_id: selected!.id, doc_type: docType } }),
    onSuccess: (res) => {
      toast.success("Draft generated");
      setActiveDraftId(res.id);
      queryClient.invalidateQueries({ queryKey: ["docs-drafts", selected?.id, docType] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMut = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          draft_id: activeDraft!.id,
          body_markdown: editedBody,
          title: editedTitle,
          action: "edit",
          approval_status: "edited",
        },
      }),
    onSuccess: () => {
      toast.success("Draft saved");
      queryClient.invalidateQueries({ queryKey: ["docs-drafts", selected?.id, docType] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decisionMut = useMutation({
    mutationFn: (action: "approve" | "reject") =>
      updateFn({
        data: {
          draft_id: activeDraft!.id,
          action,
          approval_status: action === "approve" ? "approved" : "rejected",
        },
      }),
    onSuccess: (_d, action) => {
      toast.success(action === "approve" ? "Approved" : "Rejected");
      queryClient.invalidateQueries({ queryKey: ["docs-drafts", selected?.id, docType] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { draft_id: id } }),
    onSuccess: () => {
      toast.success("Draft deleted");
      setActiveDraftId(null);
      queryClient.invalidateQueries({ queryKey: ["docs-drafts", selected?.id, docType] });
    },
  });

  const copyMd = async () => {
    if (!activeDraft) return;
    await navigator.clipboard.writeText(editedBody);
    await updateFn({ data: { draft_id: activeDraft.id, action: "copy" } }).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (repoLoading) {
    return <div className="p-10 text-center text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin inline mr-2" />Loading…</div>;
  }
  if (!hasConnectedRepo) {
    return (
      <div>
        <PageHeader title="Documentation Generator" description="AI-drafted documentation for the files every healthy project needs." />
        <EmptyRepositoryState />
      </div>
    );
  }

  const aiConfigured = aiStatusQ.data?.configured ?? false;
  const structured = (activeDraft?.structured_result ?? {}) as {
    confidence?: number;
    missingContext?: string[];
    safetyNotes?: string[];
    sourceDataSummary?: string;
    purpose?: string;
  };

  return (
    <div>
      <PageHeader
        title="Documentation Generator"
        description="Generate editable Markdown drafts of the docs every healthy open-source project needs. All drafts are clearly labeled AI draft."
        actions={
          <div className="flex items-center gap-2">
            <DataSourceBadge variant={selected ? "live" : "demo"} />
            <RepoSelector />
          </div>
        }
      />

      {!aiConfigured && (
        <div className="panel rounded-xl p-4 mb-4 border-warning/30 bg-warning/10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-4 text-warning mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-warning">AI gateway not configured</div>
              <p className="text-xs text-muted-foreground mt-1">
                Documentation generation is disabled until <code className="text-foreground">LOVABLE_API_KEY</code> is set in the backend environment. Connect Lovable AI to enable AI drafts.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Doc type sidebar */}
        <div className="panel rounded-xl p-2 space-y-0.5 h-fit">
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Doc type</div>
          {DOC_TYPES.map((k) => {
            const label = DOC_TYPE_LABELS[k];
            return (
              <button
                key={k}
                onClick={() => { setDocType(k); setActiveDraftId(null); }}
                className={`w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-left ${
                  docType === k ? "bg-accent text-foreground" : "hover:bg-accent/40 text-muted-foreground"
                }`}
              >
                <FileText className="size-3.5 shrink-0" />
                <span className="truncate text-xs">{label.title}</span>
              </button>
            );
          })}
        </div>

        {/* Main editor */}
        <div className="lg:col-span-3 space-y-4">
          <div className="panel rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold">{DOC_TYPE_LABELS[docType].title}</h3>
                  {activeDraft && <AIBadge confidence={structured.confidence} />}
                  {activeDraft && <StatusBadge status={activeDraft.approval_status} />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{DOC_TYPE_LABELS[docType].purpose}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{DOC_TYPE_LABELS[docType].filename}</p>
              </div>
              <Button
                size="sm"
                disabled={!aiConfigured || generateMut.isPending || !selected}
                onClick={() => generateMut.mutate()}
              >
                {generateMut.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                {activeDraft ? "Regenerate" : "Generate draft"}
              </Button>
            </div>

            {!activeDraft && !draftsQ.isLoading && (
              <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No draft yet. Click <span className="text-foreground font-medium">Generate draft</span> to create one from live repository signals.
              </div>
            )}

            {draftsQ.isLoading && (
              <div className="p-6 text-center text-muted-foreground text-sm"><Loader2 className="size-4 animate-spin inline mr-2" />Loading drafts…</div>
            )}

            {activeDraft && (
              <>
                <input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm mb-3"
                  placeholder="Title"
                />

                <div className="flex items-center gap-1 mb-2 text-xs">
                  <button
                    onClick={() => setPreviewMode(false)}
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${!previewMode ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface hover:bg-accent"}`}
                  ><Pencil className="size-3" /> Edit</button>
                  <button
                    onClick={() => setPreviewMode(true)}
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${previewMode ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface hover:bg-accent"}`}
                  ><Eye className="size-3" /> Preview</button>
                  <span className="ml-auto text-muted-foreground">
                    {activeDraft.model ?? "—"} · updated {formatDistanceToNow(new Date(activeDraft.updated_at), { addSuffix: true })}
                  </span>
                </div>

                {previewMode ? (
                  <pre className="w-full min-h-[420px] max-h-[600px] overflow-auto rounded-md border border-border bg-background p-4 text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">{editedBody}</pre>
                ) : (
                  <textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    className="w-full h-[500px] rounded-md border border-border bg-background p-3 text-xs font-mono leading-relaxed text-foreground/90"
                  />
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={copyMd}>
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    Copy Markdown
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                    {saveMut.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    Save draft
                  </Button>
                  <Button size="sm" onClick={() => decisionMut.mutate("approve")} disabled={decisionMut.isPending}>
                    <Check className="size-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => decisionMut.mutate("reject")} disabled={decisionMut.isPending}>
                    <X className="size-3.5" /> Reject
                  </Button>

                  <div className="ml-auto flex items-center gap-1">
                    <FutureButton icon={<GitPullRequest className="size-3.5" />} label="Create PR with this doc — coming soon" />
                    <FutureButton icon={<Github className="size-3.5" />} label="Commit file to GitHub — coming soon" />
                  </div>
                </div>

                {/* Missing context + safety + source */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <InfoPanel title="Missing context" items={structured.missingContext ?? []} tone="warning" empty="The draft used all available signals." />
                  <InfoPanel title="Safety notes" items={structured.safetyNotes ?? []} tone="info" empty="No specific cautions flagged." />
                </div>

                {structured.sourceDataSummary && (
                  <div className="mt-3 rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
                    <div className="text-[10px] uppercase tracking-wider mb-1">Source data summary</div>
                    {structured.sourceDataSummary}
                  </div>
                )}
              </>
            )}
          </div>

          {/* History */}
          {drafts.length > 1 && (
            <div className="panel rounded-xl p-3">
              <div className="px-1 py-1 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Previous drafts</div>
              <ul className="text-sm">
                {drafts.map((d) => (
                  <li
                    key={d.id}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent/40 ${activeDraft?.id === d.id ? "bg-accent" : ""}`}
                    onClick={() => setActiveDraftId(d.id)}
                  >
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span className="truncate flex-1">{d.title || DOC_TYPE_LABELS[d.doc_type as DocType]?.title}</span>
                    <StatusBadge status={d.approval_status} />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(d.updated_at), { addSuffix: true })}
                    </span>
                    <button
                      className="text-muted-foreground hover:text-destructive p-1"
                      onClick={(e) => { e.stopPropagation(); deleteMut.mutate(d.id); }}
                      aria-label="Delete draft"
                    ><X className="size-3" /></button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-muted text-muted-foreground border-border",
    edited: "bg-warning/10 text-warning border-warning/30",
    approved: "bg-success/15 text-success border-success/30",
    rejected: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium capitalize ${map[status] ?? map.pending}`}>
      {status}
    </span>
  );
}

function InfoPanel({ title, items, tone, empty }: { title: string; items: string[]; tone: "warning" | "info"; empty: string }) {
  const cls = tone === "warning"
    ? "border-warning/30 bg-warning/5"
    : "border-info/30 bg-info/5";
  return (
    <div className={`rounded-md border ${cls} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{title}</div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="text-xs space-y-1 list-disc list-inside marker:text-muted-foreground">
          {items.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      )}
    </div>
  );
}

function FutureButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      title="MaintainerOS does not write documentation files to GitHub yet. Copy the approved draft manually or wait for the future PR workflow."
      className="inline-flex items-center gap-1 rounded-md border border-dashed border-border bg-muted/30 px-2 py-1 text-[10px] text-muted-foreground cursor-not-allowed"
    >
      {icon}
      {label}
    </span>
  );
}
