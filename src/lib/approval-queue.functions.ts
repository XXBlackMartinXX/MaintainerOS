import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  normaliseApprovalStatus,
  type ApprovalState,
  type QueueItem,
} from "./approval-queue/queue";

/**
 * Read-only aggregate of pending and recent AI drafts across:
 * - issue_triage_results
 * - pull_request_ai_summaries
 * - release_drafts
 * - documentation_drafts
 *
 * This is for display only — every actionable transition (approve / edit /
 * publish) still happens through the existing per-source server functions
 * and the PublishConfirmDialog, so the human-approval gate is preserved.
 */
export const listApprovalQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        repository_id: z.string().uuid(),
        limit: z.number().int().min(1).max(200).default(80),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const repoId = data.repository_id;
    const limit = data.limit;

    const [triage, prs, releases, docs] = await Promise.all([
      supabase
        .from("issue_triage_results")
        .select("id, input_title, model, approval_status, updated_at, result, repository_id")
        .eq("repository_id", repoId)
        .order("updated_at", { ascending: false })
        .limit(limit),
      supabase
        .from("pull_request_ai_summaries")
        .select("id, release_note_candidate, model, approval_status, updated_at, repository_id")
        .eq("repository_id", repoId)
        .order("updated_at", { ascending: false })
        .limit(limit),
      supabase
        .from("release_drafts")
        .select("id, version, title, status, updated_at, repository_id")
        .eq("repository_id", repoId)
        .order("updated_at", { ascending: false })
        .limit(limit),
      supabase
        .from("documentation_drafts")
        .select(
          "id, doc_type, title, model, approval_status, updated_at, repository_id, structured_result",
        )
        .eq("repository_id", repoId)
        .order("updated_at", { ascending: false })
        .limit(limit),
    ]);

    const items: QueueItem[] = [];

    for (const row of triage.data ?? []) {
      const confidence = readConfidence(row.result);
      items.push({
        id: row.id,
        source: "issue_triage",
        title: row.input_title ?? "Issue triage draft",
        approvalStatus: normaliseApprovalStatus(row.approval_status) as ApprovalState,
        updatedAt: row.updated_at,
        repositoryId: row.repository_id,
        model: row.model,
        confidence,
      });
    }

    for (const row of prs.data ?? []) {
      items.push({
        id: row.id,
        source: "pr_summary",
        title: row.release_note_candidate
          ? row.release_note_candidate.slice(0, 120)
          : "PR summary draft",
        approvalStatus: normaliseApprovalStatus(row.approval_status) as ApprovalState,
        updatedAt: row.updated_at,
        repositoryId: row.repository_id,
        model: row.model,
      });
    }

    for (const row of releases.data ?? []) {
      items.push({
        id: row.id,
        source: "release_draft",
        title: row.title || (row.version ? `Release ${row.version}` : "Release draft"),
        approvalStatus: normaliseApprovalStatus(row.status) as ApprovalState,
        updatedAt: row.updated_at,
        repositoryId: row.repository_id,
      });
    }

    for (const row of docs.data ?? []) {
      items.push({
        id: row.id,
        source: "documentation",
        title: row.title || `Documentation: ${row.doc_type}`,
        approvalStatus: normaliseApprovalStatus(row.approval_status) as ApprovalState,
        updatedAt: row.updated_at,
        repositoryId: row.repository_id,
        model: row.model,
        confidence: readConfidence(row.structured_result),
      });
    }

    return { items };
  });

function readConfidence(value: unknown): number | null {
  if (!value || typeof value !== "object") return null;
  const v = (value as { confidence?: unknown }).confidence;
  return typeof v === "number" ? v : null;
}
