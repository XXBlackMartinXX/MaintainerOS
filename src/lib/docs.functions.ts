import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  callAIJson,
  extractJson,
  isAiConfigured,
  AIConfigError,
  AICreditsError,
  AIRateLimitError,
  DEFAULT_TRIAGE_MODEL,
} from "./ai/provider.server";
import { documentationResultSchema, approvalStatuses } from "./ai/schemas";
import {
  DOC_TYPES,
  DOC_TYPE_LABELS,
  DOCS_SYSTEM_PROMPT,
  buildDocsUserPrompt,
  type DocType,
} from "./ai/prompts/docs-generator";

async function logAudit(
  userId: string,
  action: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {},
) {
  await supabaseAdmin.from("audit_logs").insert({
    user_id: userId,
    action,
    target_type: "documentation_draft",
    target_id: targetId,
    metadata: metadata as never,
  });
}

export const getDocsAiStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({ configured: isAiConfigured(), model: DEFAULT_TRIAGE_MODEL }));

/** Generate a documentation draft from live repo signals. */
export const generateDocumentation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      repository_id: z.string().uuid(),
      doc_type: z.enum(DOC_TYPES),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { supabase } = context;

    const { data: repo, error: repoErr } = await supabase
      .from("repositories")
      .select("id, full_name, description, primary_language, default_branch, visibility, stars, forks, open_issues")
      .eq("id", data.repository_id)
      .maybeSingle();
    if (repoErr) throw new Error(repoErr.message);
    if (!repo) throw new Error("Repository not found or not accessible");

    const [{ data: contributors }, { data: labels }, { data: approvedPrs }] = await Promise.all([
      supabase.from("contributors").select("login").eq("repository_id", repo.id).limit(50),
      supabase.from("labels").select("name").eq("repository_id", repo.id).limit(40),
      supabase
        .from("pull_request_ai_summaries")
        .select("release_note_candidate")
        .eq("repository_id", repo.id)
        .eq("approval_status", "approved")
        .limit(10),
    ]);

    try {
      const { raw, model } = await callAIJson({
        messages: [
          { role: "system", content: DOCS_SYSTEM_PROMPT },
          {
            role: "user",
            content: buildDocsUserPrompt({
              docType: data.doc_type as DocType,
              repoFullName: repo.full_name,
              description: repo.description ?? null,
              primaryLanguage: repo.primary_language ?? null,
              defaultBranch: repo.default_branch ?? null,
              visibility: repo.visibility ?? null,
              stars: repo.stars ?? 0,
              forks: repo.forks ?? 0,
              openIssues: repo.open_issues ?? 0,
              contributorCount: contributors?.length ?? 0,
              recentReleaseTitles: [],
              topLabels: (labels ?? []).map((l) => l.name).filter(Boolean),
              approvedPrSummaryHighlights: (approvedPrs ?? [])
                .map((p) => p.release_note_candidate)
                .filter((s): s is string => typeof s === "string" && s.length > 0),
              hasSecurityMd: null,
              hasContributingMd: null,
              hasCodeOfConduct: null,
            }),
          },
        ],
      });

      const parsed = documentationResultSchema.safeParse(extractJson(raw));
      if (!parsed.success) {
        await logAudit(userId, "ai.docs.failed", null, {
          reason: "schema", model, doc_type: data.doc_type,
        });
        throw new Error("AI returned invalid documentation output");
      }
      const result = parsed.data;
      const meta = DOC_TYPE_LABELS[data.doc_type as DocType];

      const { data: inserted, error: insErr } = await supabaseAdmin
        .from("documentation_drafts")
        .insert({
          repository_id: repo.id,
          user_id: userId,
          doc_type: data.doc_type,
          title: result.title || meta.title,
          body_markdown: result.bodyMarkdown,
          structured_result: result as never,
          model,
          approval_status: "pending",
        })
        .select("id")
        .single();
      if (insErr) throw new Error(insErr.message);

      await logAudit(userId, "ai.docs.generated", inserted.id, {
        model, doc_type: data.doc_type, repository_id: repo.id,
        confidence: result.confidence,
      });
      return { ok: true, id: inserted.id, result, model };
    } catch (err) {
      const code =
        err instanceof AIConfigError ? "ai.config_missing"
        : err instanceof AICreditsError ? "ai.credits_exhausted"
        : err instanceof AIRateLimitError ? "ai.rate_limited"
        : "ai.error";
      await logAudit(userId, "ai.docs.failed", null, {
        code, message: (err as Error).message, doc_type: data.doc_type,
      });
      throw err;
    }
  });

export const listDocumentationDrafts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      repository_id: z.string().uuid(),
      doc_type: z.enum(DOC_TYPES).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("documentation_drafts")
      .select("id, doc_type, title, body_markdown, structured_result, model, approval_status, created_at, updated_at")
      .eq("repository_id", data.repository_id)
      .order("updated_at", { ascending: false });
    if (data.doc_type) query = query.eq("doc_type", data.doc_type);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { drafts: rows ?? [] };
  });

export const updateDocumentationDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      draft_id: z.string().uuid(),
      body_markdown: z.string().max(40000).optional(),
      title: z.string().max(200).optional(),
      approval_status: z.enum(approvalStatuses).optional(),
      action: z.enum(["approve","edit","reject","copy"]).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof data.body_markdown === "string") patch.body_markdown = data.body_markdown;
    if (typeof data.title === "string") patch.title = data.title;
    if (data.approval_status) patch.approval_status = data.approval_status;

    if (Object.keys(patch).length > 1) {
      const { error } = await context.supabase
        .from("documentation_drafts")
        .update(patch)
        .eq("id", data.draft_id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
    }
    if (data.action) {
      await logAudit(userId, `ai.docs.${data.action}`, data.draft_id, {
        approval_status: data.approval_status ?? null,
      });
    }
    return { ok: true };
  });

export const deleteDocumentationDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ draft_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("documentation_drafts")
      .delete()
      .eq("id", data.draft_id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Readiness signals derived from live repo state + existing drafts. */
export const getRepoReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ repository_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: repo } = await supabase
      .from("repositories")
      .select("id, full_name, default_branch, pushed_at")
      .eq("id", data.repository_id)
      .maybeSingle();
    if (!repo) throw new Error("Repository not found");

    const [{ data: drafts }, { data: lastSync }, { data: tokens }] = await Promise.all([
      supabase
        .from("documentation_drafts")
        .select("doc_type, approval_status")
        .eq("repository_id", repo.id),
      supabase
        .from("sync_jobs")
        .select("status, finished_at")
        .eq("repository_id", repo.id)
        .order("started_at", { ascending: false })
        .limit(1),
      supabase.from("user_github_tokens").select("scopes").eq("user_id", context.userId).limit(1),
    ]);

    const draftByType = new Map<string, string>();
    for (const d of drafts ?? []) draftByType.set(d.doc_type, d.approval_status);

    const scopes = (tokens?.[0]?.scopes ?? "").split(/[ ,]+/).filter(Boolean);
    const hasWriteScope = scopes.includes("repo") || scopes.includes("public_repo");

    const lastFinished = lastSync?.[0]?.finished_at ?? null;
    const syncFreshDays = lastFinished
      ? Math.max(0, Math.round((Date.now() - new Date(lastFinished).getTime()) / 86_400_000))
      : null;

    return {
      repository: repo,
      drafts: draftByType,
      syncFreshDays,
      lastSyncStatus: lastSync?.[0]?.status ?? null,
      hasWriteScope,
      auditEnabled: true,
    };
  });
