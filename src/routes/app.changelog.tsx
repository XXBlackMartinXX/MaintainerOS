import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Copy, Save, Loader2, Check, FileText } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, AIBadge } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { RepoSelector } from "@/components/repo-selector";
import { DataSourceBadge } from "@/components/data-source-badge";
import { EmptyRepositoryState } from "@/components/empty-states";
import { useSelectedRepo } from "@/hooks/use-selected-repo";
import { useHasSession } from "@/hooks/use-has-session";
import {
  listPrSummariesForRepo,
  generateChangelog,
  listReleaseDrafts,
  updateReleaseDraft,
} from "@/lib/ai-pr.functions";
import {
  publishReleaseDraft,
  getGithubWritePermissions,
  listPublishEventsForSource,
} from "@/lib/github-publish.functions";
import { PublishConfirmDialog } from "@/components/publish-confirm-dialog";
import {
  AlreadyPublishedNotice,
  GitHubPermissionWarning,
  PublishStatusBadge,
  getPublishEventForSource,
} from "@/components/publish-helpers";
import { Send } from "lucide-react";

export const Route = createFileRoute("/app/changelog")({ component: ChangelogPage });

type DraftRow = {
  id: string;
  version: string;
  title: string;
  body_markdown: string;
  result: Record<string, unknown>;
  status: string;
  updated_at: string;
};

function ChangelogPage() {
  const { selected, hasConnectedRepo, isLoading: reposLoading } = useSelectedRepo();
  const hasSession = useHasSession();
  const qc = useQueryClient();
  const summariesFn = useServerFn(listPrSummariesForRepo);
  const generateFn = useServerFn(generateChangelog);
  const draftsFn = useServerFn(listReleaseDrafts);
  const updateFn = useServerFn(updateReleaseDraft);

  const permsFn = useServerFn(getGithubWritePermissions);
  const publishFn = useServerFn(publishReleaseDraft);
  const listEventsFn = useServerFn(listPublishEventsForSource);

  const summariesQ = useQuery({
    queryKey: ["pr-summaries", selected?.id],
    queryFn: () => summariesFn({ data: { repository_id: selected!.id } }),
    enabled: !!selected,
  });
  const draftsQ = useQuery({
    queryKey: ["release-drafts", selected?.id],
    queryFn: () => draftsFn({ data: { repository_id: selected!.id } }),
    enabled: !!selected,
  });
  const permsQ = useQuery({ queryKey: ["github-perms"], queryFn: () => permsFn(), enabled: hasSession === true });

  const summaries = summariesQ.data?.summaries ?? [];
  const approved = summaries.filter((s) => s.approval_status === "approved");

  const drafts = (draftsQ.data?.drafts ?? []) as DraftRow[];
  const [activeId, setActiveId] = useState<string | null>(null);
  const [version, setVersion] = useState("0.1.0");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [repost, setRepost] = useState(false);

  const active = useMemo(() => drafts.find((d) => d.id === activeId) ?? null, [drafts, activeId]);

  const eventsQ = useQuery({
    queryKey: ["publish-events", "release_draft", active?.id],
    queryFn: () => listEventsFn({ data: { source_type: "release_draft", source_id: active!.id } }),
    enabled: !!active?.id,
  });
  const event = getPublishEventForSource(eventsQ.data?.events, "success");
  const canPublish =
    !!active &&
    active.status === "approved" &&
    !!permsQ.data?.canCreateReleases &&
    !!body &&
    !!version;

  useEffect(() => {
    if (active) {
      setVersion(active.version || version);
      setTitle(active.title || "");
      setBody(active.body_markdown || "");
    }
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onGenerate() {
    if (!selected) return;
    if (approved.length === 0) {
      if (
        !window.confirm(
          "No approved PR summaries yet. Generate a preview-only draft with limited data?",
        )
      )
        return;
    }
    setGenerating(true);
    try {
      const r = await generateFn({ data: { repository_id: selected.id, version } });
      toast.success(`AI draft generated from ${r.approvedCount} approved PR summaries`);
      await qc.invalidateQueries({ queryKey: ["release-drafts", selected.id] });
      setActiveId(r.id);
    } catch (err) {
      toast.error((err as Error).message || "Changelog generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function onSave(action: "save" | "approve" | "reject") {
    if (!active) return;
    setSaving(true);
    try {
      await updateFn({
        data: {
          draft_id: active.id,
          version,
          title,
          body_markdown: body,
          status: action === "approve" ? "approved" : action === "reject" ? "rejected" : "draft",
          action,
        },
      });
      toast.success(`Draft ${action === "save" ? "saved" : action + "d"}`);
      await qc.invalidateQueries({ queryKey: ["release-drafts", selected?.id] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onCopy() {
    if (!body) return;
    await navigator.clipboard.writeText(body);
    if (active) {
      await updateFn({ data: { draft_id: active.id, status: "copied", action: "copy" } });
      await qc.invalidateQueries({ queryKey: ["release-drafts", selected?.id] });
    }
    toast.success("Markdown copied");
  }

  const dataVariant: "live" | "partial" | "preview" =
    approved.length >= 3 ? "live" : approved.length > 0 ? "partial" : "preview";
  const dataLabel =
    dataVariant === "live"
      ? `${approved.length} approved PR summaries`
      : dataVariant === "partial"
        ? `Partial — only ${approved.length} approved PR summaries`
        : "Preview only — no approved PR summaries yet";

  const header = (
    <PageHeader
      title="Changelog generator"
      description="AI draft release notes built from approved PR summaries. Editable. Not posted to GitHub."
      actions={
        <>
          {selected && <DataSourceBadge variant={dataVariant} label={dataLabel} />}
          <RepoSelector />
        </>
      }
    />
  );

  if (reposLoading)
    return (
      <div>
        {header}
        <Loading />
      </div>
    );
  if (!hasConnectedRepo)
    return (
      <div>
        {header}
        <EmptyRepositoryState />
      </div>
    );

  const result = (active?.result ?? {}) as Record<string, unknown>;
  const recommendation = String(result.versionRecommendation ?? "unknown");
  const rationale = String(result.recommendationRationale ?? "");

  return (
    <div>
      {header}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="panel rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs text-muted-foreground">Version</label>
              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="rounded-md border border-border bg-surface px-2 py-1 text-sm font-mono w-28"
                placeholder="0.1.0"
              />
              <label className="text-xs text-muted-foreground ml-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
              />
              <Button size="sm" variant="outline" disabled={generating} onClick={onGenerate}>
                {generating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Generate AI draft
              </Button>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Release title"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            />
            {active && (
              <div className="flex items-center gap-2 text-xs">
                <AIBadge />
                <span>Suggested bump:</span>
                <span className="font-mono text-foreground capitalize">{recommendation}</span>
                {rationale && <span className="text-muted-foreground italic">— {rationale}</span>}
              </div>
            )}
          </div>

          <div className="panel rounded-xl">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-medium">Editable Markdown</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={!body} onClick={onCopy}>
                  <Copy className="size-3.5" /> Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!active || saving}
                  onClick={() => onSave("save")}
                >
                  <Save className="size-3.5" /> Save draft
                </Button>
                <Button size="sm" disabled={!active || saving} onClick={() => onSave("approve")}>
                  <Check className="size-3.5" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canPublish}
                  onClick={() => {
                    setRepost(!!event);
                    setPublishOpen(true);
                  }}
                >
                  <Send className="size-3.5" />{" "}
                  {event ? "Create draft again" : "Create GitHub release draft"}
                </Button>
                {event && <PublishStatusBadge status="success" />}
              </div>
            </div>
            {active &&
              active.status === "approved" &&
              permsQ.data &&
              !permsQ.data.canCreateReleases && (
                <div className="px-4 pt-3">
                  <GitHubPermissionWarning
                    missing="create releases"
                    hasToken={permsQ.data.hasToken}
                  />
                </div>
              )}
            {event && (
              <div className="px-4 pt-3">
                <AlreadyPublishedNotice
                  event={event}
                  republishLabel="Create draft again"
                  onRepublish={() => {
                    setRepost(true);
                    setPublishOpen(true);
                  }}
                />
              </div>
            )}
            <PublishConfirmDialog
              open={publishOpen}
              onOpenChange={(v) => {
                setPublishOpen(v);
                if (!v) setRepost(false);
              }}
              kind="release_draft"
              previousUrl={repost ? event?.github_url : null}
              preview={
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Tag:</span>{" "}
                    <span className="font-mono">
                      {version.startsWith("v") ? version : `v${version}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Title:</span> {title || "(empty)"}
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-xs mt-2 border-t border-border pt-2">
                    {body}
                  </pre>
                </div>
              }
              onConfirm={async () => {
                if (!active) return { ok: false };
                const res = await publishFn({
                  data: { draft_id: active.id, confirm: true, allow_repost: repost },
                });
                await eventsQ.refetch();
                return res;
              }}
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                active
                  ? ""
                  : "Generate an AI draft from approved PR summaries, or paste your own Markdown here."
              }
              rows={20}
              className="w-full px-4 py-3 text-sm font-mono bg-surface focus:outline-none rounded-b-xl"
            />
          </div>

          {active && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SectionList title="Breaking changes" items={asArr(result.breakingChanges)} />
              <SectionList title="Migration notes" items={asArr(result.migrationNotes)} />
              <SectionList title="Known limitations" items={asArr(result.knownLimitations)} />
              <SectionList title="Missing context" items={asArr(result.missingContext)} muted />
              <SectionList title="Safety notes" items={asArr(result.safetyNotes)} muted />
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="panel rounded-xl">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-medium">Saved drafts</h3>
              <span className="text-xs text-muted-foreground">{drafts.length}</span>
            </div>
            {drafts.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                No drafts yet. Generate one above.
              </div>
            ) : (
              <ul>
                {drafts.map((d) => (
                  <li
                    key={d.id}
                    onClick={() => setActiveId(d.id)}
                    className={`px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-accent/30 ${
                      activeId === d.id ? "bg-accent/40" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="size-3.5 text-muted-foreground" />
                      <span className="font-mono text-xs">{d.version || "—"}</span>
                      <span className="truncate flex-1">{d.title || "Untitled release"}</span>
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {d.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel rounded-xl p-4 text-xs text-muted-foreground space-y-1">
            <p>
              <strong className="text-foreground">Source:</strong> approved AI PR summaries (
              {approved.length} approved of {summaries.length} total).
            </p>
            <p>The AI is instructed to use only approved summaries and flag missing data.</p>
            <p>Nothing is posted to GitHub automatically.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function asArr(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

function SectionList({ title, items, muted }: { title: string; items: string[]; muted?: boolean }) {
  if (!items.length) return null;
  return (
    <div className="panel rounded-xl p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{title}</div>
      <ul className={`text-sm list-disc pl-5 space-y-0.5 ${muted ? "text-muted-foreground" : ""}`}>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function Loading() {
  return (
    <div className="panel rounded-xl p-10 text-center text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin inline mr-2" /> Loading…
    </div>
  );
}
