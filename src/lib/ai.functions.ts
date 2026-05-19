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
import { triageResultSchema, approvalStatuses } from "./ai/schemas";
import { TRIAGE_SYSTEM_PROMPT, buildTriageUserPrompt } from "./ai/prompts/issue-triage";

async function logAudit(userId: string, action: string, targetId: string | null, metadata: Record<string, unknown> = {}) {
  await supabaseAdmin.from("audit_logs").insert({
    user_id: userId,
    action,
    target_type: "issue_triage",
    target_id: targetId,
    metadata,
  });
}

export const getAiStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return { configured: isAiConfigured(), model: DEFAULT_TRIAGE_MODEL };
  });

/** Run AI triage for one issue and persist the draft. */
export const triageIssue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ issue_id: z.string().uuid(), reanalyze: z.boolean().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { supabase } = context;

    // Load issue + repo (RLS-scoped)
    const { data: issue, error: issueErr } = await supabase
      .from("issues")
      .select("id, repository_id, number, title, body, state, author_login, labels")
      .eq("id", data.issue_id)
      .maybeSingle();
    if (issueErr) throw new Error(issueErr.message);
    if (!issue) throw new Error("Issue not found or not accessible");

    if (!data.reanalyze) {
      const { data: existing } = await supabase
        .from("issue_triage_results")
        .select("id")
        .eq("issue_id", issue.id)
        .eq("user_id", userId)
        .maybeSingle();
      if (existing) {
        return { ok: true, existed: true, id: existing.id };
      }
    }

    const { data: repo } = await supabase
      .from("repositories")
      .select("full_name")
      .eq("id", issue.repository_id)
      .maybeSingle();

    const labels = Array.isArray(issue.labels)
      ? (issue.labels as Array<{ name?: string }>).map((l) => l?.name ?? "").filter(Boolean)
      : [];

    try {
      const { raw, model } = await callAIJson({
        messages: [
          { role: "system", content: TRIAGE_SYSTEM_PROMPT },
          {
            role: "user",
            content: buildTriageUserPrompt({
              repoFullName: repo?.full_name ?? "unknown/unknown",
              number: issue.number,
              title: issue.title,
              body: issue.body,
              labels,
              author: issue.author_login,
              state: issue.state,
            }),
          },
        ],
      });
      const parsed = triageResultSchema.safeParse(extractJson(raw));
      if (!parsed.success) {
        await logAudit(userId, "ai.triage.failed", issue.id, { reason: "schema", model });
        throw new Error("AI returned invalid structured output");
      }
      const result = parsed.data;

      const { data: upserted, error: upErr } = await supabaseAdmin
        .from("issue_triage_results")
        .upsert(
          {
            issue_id: issue.id,
            repository_id: issue.repository_id,
            user_id: userId,
            model,
            input_title: issue.title,
            input_body: issue.body,
            result,
            suggested_reply: result.suggestedMaintainerReply,
            approval_status: "pending",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "issue_id,user_id" as never },
        )
        .select("id")
        .maybeSingle();

      // Fallback if upsert without unique constraint: just insert
      let triageId = upserted?.id ?? null;
      if (upErr || !triageId) {
        const { data: ins, error: insErr } = await supabaseAdmin
          .from("issue_triage_results")
          .insert({
            issue_id: issue.id,
            repository_id: issue.repository_id,
            user_id: userId,
            model,
            input_title: issue.title,
            input_body: issue.body,
            result,
            suggested_reply: result.suggestedMaintainerReply,
            approval_status: "pending",
          })
          .select("id")
          .single();
        if (insErr) throw new Error(insErr.message);
        triageId = ins.id;
      }

      await logAudit(userId, "ai.triage.generated", issue.id, {
        model,
        triage_id: triageId,
        issueType: result.issueType,
        severity: result.severity,
        confidence: result.confidence,
      });
      return { ok: true, id: triageId, result, model };
    } catch (err) {
      const code =
        err instanceof AIConfigError ? "ai.config_missing"
        : err instanceof AICreditsError ? "ai.credits_exhausted"
        : err instanceof AIRateLimitError ? "ai.rate_limited"
        : "ai.error";
      await logAudit(userId, "ai.triage.failed", issue.id, { code, message: (err as Error).message });
      throw err;
    }
  });

export const listTriageForRepo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ repository_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("issue_triage_results")
      .select("id, issue_id, model, result, suggested_reply, approval_status, created_at, updated_at")
      .eq("repository_id", data.repository_id)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { triage: rows ?? [] };
  });

export const updateTriageDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      triage_id: z.string().uuid(),
      suggested_reply: z.string().max(4000).optional(),
      approval_status: z.enum(approvalStatuses).optional(),
      action: z.enum(["approve","edit","reject","copy"]).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const patch: Record<string, unknown> = {};
    if (typeof data.suggested_reply === "string") patch.suggested_reply = data.suggested_reply;
    if (data.approval_status) patch.approval_status = data.approval_status;
    patch.updated_at = new Date().toISOString();

    if (Object.keys(patch).length > 1) {
      const { error } = await context.supabase
        .from("issue_triage_results")
        .update(patch)
        .eq("id", data.triage_id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
    }
    if (data.action) {
      await logAudit(userId, `ai.triage.${data.action}`, data.triage_id, {
        approval_status: data.approval_status ?? null,
      });
    }
    return { ok: true };
  });

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      repository_id: z.string().uuid().optional(),
      action_prefix: z.string().max(40).optional(),
      limit: z.number().int().min(1).max(500).default(200),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("audit_logs")
      .select("id, action, target_type, target_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.action_prefix) query = query.like("action", `${data.action_prefix}%`);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { logs: rows ?? [] };
  });
