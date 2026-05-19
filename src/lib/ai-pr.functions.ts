import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  callAIJson,
  extractJson,
  AIConfigError,
  AICreditsError,
  AIRateLimitError,
} from "./ai/provider.server";
import {
  prSummarySchema,
  approvalStatuses,
  changelogResultSchema,
  releaseDraftStatuses,
} from "./ai/schemas";
import { PR_SUMMARY_SYSTEM_PROMPT, buildPrSummaryUserPrompt } from "./ai/prompts/pr-summary";
import { CHANGELOG_SYSTEM_PROMPT, buildChangelogUserPrompt } from "./ai/prompts/changelog";

async function logAudit(
  userId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {},
) {
  await supabaseAdmin.from("audit_logs").insert({
    user_id: userId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata: metadata as never,
  });
}

/** Generate AI summary for a single pull request and persist as editable draft. */
export const summarizePullRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ pull_request_id: z.string().uuid(), reanalyze: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { supabase } = context;

    const { data: pr, error: prErr } = await supabase
      .from("pull_requests")
      .select(
        "id, repository_id, number, title, body, state, author_login, draft, additions, deletions, changed_files, merged_at",
      )
      .eq("id", data.pull_request_id)
      .maybeSingle();
    if (prErr) throw new Error(prErr.message);
    if (!pr) throw new Error("Pull request not found or not accessible");

    if (!data.reanalyze) {
      const { data: existing } = await supabase
        .from("pull_request_ai_summaries")
        .select("id")
        .eq("pull_request_id", pr.id)
        .eq("user_id", userId)
        .maybeSingle();
      if (existing) return { ok: true, existed: true, id: existing.id };
    }

    const { data: repo } = await supabase
      .from("repositories")
      .select("full_name")
      .eq("id", pr.repository_id)
      .maybeSingle();

    try {
      const { raw, model } = await callAIJson({
        messages: [
          { role: "system", content: PR_SUMMARY_SYSTEM_PROMPT },
          {
            role: "user",
            content: buildPrSummaryUserPrompt({
              repoFullName: repo?.full_name ?? "unknown/unknown",
              number: pr.number,
              title: pr.title,
              body: pr.body,
              author: pr.author_login,
              state: pr.state,
              draft: !!pr.draft,
              additions: pr.additions ?? 0,
              deletions: pr.deletions ?? 0,
              changedFiles: pr.changed_files ?? 0,
              merged: !!pr.merged_at,
            }),
          },
        ],
      });
      const parsed = prSummarySchema.safeParse(extractJson(raw));
      if (!parsed.success) {
        await logAudit(userId, "ai.pr_summary.failed", "pull_request", pr.id, { reason: "schema", model });
        throw new Error("AI returned invalid structured output");
      }
      const result = parsed.data;

      const payload = {
        pull_request_id: pr.id,
        repository_id: pr.repository_id,
        user_id: userId,
        model,
        input_title_snapshot: pr.title,
        input_body_snapshot: pr.body,
        input_metadata_snapshot: {
          number: pr.number,
          state: pr.state,
          draft: pr.draft,
          additions: pr.additions,
          deletions: pr.deletions,
          changed_files: pr.changed_files,
          merged_at: pr.merged_at,
        } as never,
        result: result as never,
        release_note_candidate: result.releaseNoteCandidate,
        approval_status: "pending",
        updated_at: new Date().toISOString(),
      };

      const { data: up, error: upErr } = await supabaseAdmin
        .from("pull_request_ai_summaries")
        .upsert(payload, { onConflict: "pull_request_id,user_id" })
        .select("id")
        .single();
      if (upErr) throw new Error(upErr.message);

      await logAudit(userId, "ai.pr_summary.generated", "pull_request", pr.id, {
        model,
        summary_id: up.id,
        changeType: result.changeType,
        riskLevel: result.riskLevel,
        breakingChangeLikelihood: result.breakingChangeLikelihood,
      });
      return { ok: true, id: up.id, result, model };
    } catch (err) {
      const code =
        err instanceof AIConfigError ? "ai.config_missing"
        : err instanceof AICreditsError ? "ai.credits_exhausted"
        : err instanceof AIRateLimitError ? "ai.rate_limited"
        : "ai.error";
      await logAudit(userId, "ai.pr_summary.failed", "pull_request", pr.id, {
        code,
        message: (err as Error).message,
      });
      throw err;
    }
  });

export const listPrSummariesForRepo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ repository_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("pull_request_ai_summaries")
      .select(
        "id, pull_request_id, model, result, release_note_candidate, approval_status, created_at, updated_at",
      )
      .eq("repository_id", data.repository_id)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { summaries: rows ?? [] };
  });

export const updatePrSummaryDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        summary_id: z.string().uuid(),
        release_note_candidate: z.string().max(2000).optional(),
        approval_status: z.enum(approvalStatuses).optional(),
        action: z.enum(["approve", "edit", "reject", "copy"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const patch: {
      release_note_candidate?: string;
      approval_status?: string;
      updated_at: string;
    } = { updated_at: new Date().toISOString() };
    if (typeof data.release_note_candidate === "string")
      patch.release_note_candidate = data.release_note_candidate;
    if (data.approval_status) patch.approval_status = data.approval_status;

    if (Object.keys(patch).length > 1) {
      const { error } = await context.supabase
        .from("pull_request_ai_summaries")
        .update(patch)
        .eq("id", data.summary_id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
    }
    if (data.action) {
      await logAudit(userId, `ai.pr_summary.${data.action}`, "pr_summary", data.summary_id, {
        approval_status: data.approval_status ?? null,
      });
    }
    return { ok: true };
  });

/** Generate a changelog draft from approved PR summaries. */
export const generateChangelog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        repository_id: z.string().uuid(),
        version: z.string().max(40).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { supabase } = context;

    const { data: approved, error: appErr } = await supabase
      .from("pull_request_ai_summaries")
      .select("pull_request_id, result, release_note_candidate")
      .eq("repository_id", data.repository_id)
      .eq("approval_status", "approved");
    if (appErr) throw new Error(appErr.message);

    const { data: repo } = await supabase
      .from("repositories")
      .select("full_name")
      .eq("id", data.repository_id)
      .maybeSingle();

    const prIds = (approved ?? []).map((r) => r.pull_request_id);
    const numbersById = new Map<string, { number: number; title: string }>();
    if (prIds.length) {
      const { data: prs } = await supabase
        .from("pull_requests")
        .select("id, number, title")
        .in("id", prIds);
      for (const p of prs ?? []) numbersById.set(p.id, { number: p.number, title: p.title });
    }

    const approvedSummaries = (approved ?? []).map((r) => {
      const meta = numbersById.get(r.pull_request_id);
      const res = (r.result ?? {}) as Record<string, unknown>;
      return {
        number: meta?.number ?? 0,
        title: meta?.title ?? "",
        changeType: String(res.changeType ?? "unknown"),
        changelogCategory: String(res.changelogCategory ?? "Unknown"),
        releaseNoteCandidate: r.release_note_candidate ?? String(res.releaseNoteCandidate ?? ""),
        breakingChangeLikelihood: Number(res.breakingChangeLikelihood ?? 0),
        riskLevel: String(res.riskLevel ?? "unknown"),
      };
    });

    try {
      const { raw, model } = await callAIJson({
        messages: [
          { role: "system", content: CHANGELOG_SYSTEM_PROMPT },
          {
            role: "user",
            content: buildChangelogUserPrompt({
              repoFullName: repo?.full_name ?? "unknown/unknown",
              version: data.version,
              approvedSummaries,
            }),
          },
        ],
      });
      const parsed = changelogResultSchema.safeParse(extractJson(raw));
      if (!parsed.success) {
        await logAudit(userId, "ai.changelog.failed", "repository", data.repository_id, {
          reason: "schema",
          model,
        });
        throw new Error("AI returned invalid changelog output");
      }
      const result = parsed.data;

      const { data: draft, error: insErr } = await supabaseAdmin
        .from("release_drafts")
        .insert({
          repository_id: data.repository_id,
          user_id: userId,
          version: data.version,
          title: result.releaseTitle,
          body_markdown: result.markdown,
          result: result as never,
          status: "draft",
        })
        .select("id")
        .single();
      if (insErr) throw new Error(insErr.message);

      await logAudit(userId, "ai.changelog.generated", "release_draft", draft.id, {
        model,
        approved_pr_count: approvedSummaries.length,
        versionRecommendation: result.versionRecommendation,
      });
      return {
        ok: true,
        id: draft.id,
        result,
        model,
        approvedCount: approvedSummaries.length,
      };
    } catch (err) {
      const code =
        err instanceof AIConfigError ? "ai.config_missing"
        : err instanceof AICreditsError ? "ai.credits_exhausted"
        : err instanceof AIRateLimitError ? "ai.rate_limited"
        : "ai.error";
      await logAudit(userId, "ai.changelog.failed", "repository", data.repository_id, {
        code,
        message: (err as Error).message,
      });
      throw err;
    }
  });

export const listReleaseDrafts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ repository_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("release_drafts")
      .select("id, version, title, body_markdown, result, status, created_at, updated_at")
      .eq("repository_id", data.repository_id)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { drafts: rows ?? [] };
  });

export const updateReleaseDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        draft_id: z.string().uuid(),
        version: z.string().max(40).optional(),
        title: z.string().max(200).optional(),
        body_markdown: z.string().max(50000).optional(),
        status: z.enum(releaseDraftStatuses).optional(),
        action: z.enum(["save", "approve", "reject", "copy"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const patch: {
      version?: string;
      title?: string;
      body_markdown?: string;
      status?: string;
      updated_at: string;
    } = { updated_at: new Date().toISOString() };
    if (typeof data.version === "string") patch.version = data.version;
    if (typeof data.title === "string") patch.title = data.title;
    if (typeof data.body_markdown === "string") patch.body_markdown = data.body_markdown;
    if (data.status) patch.status = data.status;

    if (Object.keys(patch).length > 1) {
      const { error } = await context.supabase
        .from("release_drafts")
        .update(patch)
        .eq("id", data.draft_id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
    }
    if (data.action) {
      await logAudit(userId, `ai.release_draft.${data.action}`, "release_draft", data.draft_id, {
        status: data.status ?? null,
      });
    }
    return { ok: true };
  });
