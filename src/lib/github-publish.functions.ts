import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { loadUserGithubToken } from "./github/api.server";
import {
  postIssueComment,
  addIssueLabels,
  createRelease,
  parseScopes,
  evaluateWritePermissions,
  type WritePermissions,
} from "./github/write.server";

/** Verify the user is a member of the given repository. */
async function assertRepoAccess(userId: string, repositoryId: string) {
  const { data, error } = await supabaseAdmin
    .from("repository_memberships")
    .select("repository_id")
    .eq("user_id", userId)
    .eq("repository_id", repositoryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You do not have access to this repository.");
}

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

async function loadRepo(repositoryId: string) {
  const { data, error } = await supabaseAdmin
    .from("repositories")
    .select("id, owner, name, full_name, html_url")
    .eq("id", repositoryId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Repository not found.");
  return data;
}

async function loadUserScopes(userId: string): Promise<{ scopes: string[]; hasToken: boolean }> {
  const { data } = await supabaseAdmin
    .from("user_github_tokens")
    .select("scopes, access_token")
    .eq("user_id", userId)
    .maybeSingle();
  return { scopes: parseScopes(data?.scopes ?? null), hasToken: !!data?.access_token };
}

async function recordEvent(args: {
  userId: string;
  repositoryId: string;
  targetType: "issue" | "pull_request" | "release" | "issue_labels";
  targetId: string | null;
  sourceType: "issue_triage" | "pr_summary" | "release_draft";
  sourceId: string;
  status: "attempted" | "success" | "failed";
  githubUrl?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin.from("github_publish_events").insert({
    user_id: args.userId,
    repository_id: args.repositoryId,
    target_type: args.targetType,
    target_id: args.targetId,
    source_type: args.sourceType,
    source_id: args.sourceId,
    status: args.status,
    github_url: args.githubUrl ?? null,
    error_message: args.errorMessage ?? null,
    github_response_metadata: (args.metadata ?? {}) as never,
  });
  if (error) console.error("[publish] failed to record event:", error.message);
}

// ─── Permissions ────────────────────────────────────────────────────────────

export const getGithubWritePermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WritePermissions & { githubLogin: string | null }> => {
    const { scopes, hasToken } = await loadUserScopes(context.userId);
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("github_login")
      .eq("id", context.userId)
      .maybeSingle();
    return {
      ...evaluateWritePermissions(scopes, hasToken),
      githubLogin: profile?.github_login ?? null,
    };
  });

// ─── Issue comment ──────────────────────────────────────────────────────────

export const publishIssueComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        triage_id: z.string().uuid(),
        confirm: z.literal(true),
        allow_repost: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    // Load triage draft (RLS scoped to user)
    const { data: triage, error: tErr } = await context.supabase
      .from("issue_triage_results")
      .select("id, issue_id, repository_id, suggested_reply, approval_status")
      .eq("id", data.triage_id)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!triage) throw new Error("AI draft not found.");
    if (!["approved", "edited"].includes(triage.approval_status)) {
      throw new Error("Only approved or edited drafts can be posted.");
    }
    if (!triage.suggested_reply || triage.suggested_reply.trim().length === 0) {
      throw new Error("The approved reply is empty.");
    }
    await assertRepoAccess(userId, triage.repository_id);

    // Duplicate-post protection
    const { data: prior } = await supabaseAdmin
      .from("github_publish_events")
      .select("id, github_url, status")
      .eq("source_type", "issue_triage")
      .eq("source_id", triage.id)
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (prior && !data.allow_repost) {
      return { ok: false, alreadyPosted: true, previousUrl: prior.github_url } as const;
    }

    const repo = await loadRepo(triage.repository_id);
    const { data: issue } = await supabaseAdmin
      .from("issues")
      .select("number")
      .eq("id", triage.issue_id)
      .maybeSingle();
    if (!issue) throw new Error("Issue not found.");

    const { scopes, hasToken } = await loadUserScopes(userId);
    const perms = evaluateWritePermissions(scopes, hasToken);
    if (!perms.canCommentIssues) {
      throw new Error(
        "Your GitHub session is missing write scope. Reconnect to grant repo access.",
      );
    }

    await logAudit(
      userId,
      prior ? "github.issue_comment.reposted" : "github.issue_comment.attempted",
      "issue",
      triage.issue_id,
      {
        triage_id: triage.id,
        issue_number: issue.number,
      },
    );
    await recordEvent({
      userId,
      repositoryId: triage.repository_id,
      targetType: "issue",
      targetId: String(issue.number),
      sourceType: "issue_triage",
      sourceId: triage.id,
      status: "attempted",
    });

    try {
      const token = await loadUserGithubToken(userId);
      const comment = await postIssueComment({
        token,
        owner: repo.owner,
        name: repo.name,
        number: issue.number,
        body: triage.suggested_reply,
      });
      await recordEvent({
        userId,
        repositoryId: triage.repository_id,
        targetType: "issue",
        targetId: String(issue.number),
        sourceType: "issue_triage",
        sourceId: triage.id,
        status: "success",
        githubUrl: comment.html_url,
        metadata: { comment_id: comment.id },
      });
      await logAudit(userId, "github.issue_comment.success", "issue", triage.issue_id, {
        triage_id: triage.id,
        github_url: comment.html_url,
      });
      return { ok: true, githubUrl: comment.html_url } as const;
    } catch (err) {
      const message = (err as Error).message;
      await recordEvent({
        userId,
        repositoryId: triage.repository_id,
        targetType: "issue",
        targetId: String(issue.number),
        sourceType: "issue_triage",
        sourceId: triage.id,
        status: "failed",
        errorMessage: message,
      });
      await logAudit(userId, "github.issue_comment.failed", "issue", triage.issue_id, {
        triage_id: triage.id,
        error: message,
      });
      throw err;
    }
  });

// ─── Issue labels ───────────────────────────────────────────────────────────

export const publishIssueLabels = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        triage_id: z.string().uuid(),
        labels: z.array(z.string().min(1).max(50)).min(1).max(20),
        confirm: z.literal(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { data: triage, error: tErr } = await context.supabase
      .from("issue_triage_results")
      .select("id, issue_id, repository_id, approval_status")
      .eq("id", data.triage_id)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!triage) throw new Error("AI draft not found.");
    if (!["approved", "edited"].includes(triage.approval_status)) {
      throw new Error("Only approved or edited drafts can apply labels.");
    }
    await assertRepoAccess(userId, triage.repository_id);

    const repo = await loadRepo(triage.repository_id);
    const { data: issue } = await supabaseAdmin
      .from("issues")
      .select("number")
      .eq("id", triage.issue_id)
      .maybeSingle();
    if (!issue) throw new Error("Issue not found.");

    const { scopes, hasToken } = await loadUserScopes(userId);
    if (!evaluateWritePermissions(scopes, hasToken).canManageLabels) {
      throw new Error(
        "Your GitHub session is missing write scope. Reconnect to grant repo access.",
      );
    }

    await recordEvent({
      userId,
      repositoryId: triage.repository_id,
      targetType: "issue_labels",
      targetId: String(issue.number),
      sourceType: "issue_triage",
      sourceId: triage.id,
      status: "attempted",
      metadata: { labels: data.labels },
    });
    await logAudit(userId, "github.issue_labels.attempted", "issue", triage.issue_id, {
      triage_id: triage.id,
      labels: data.labels,
    });

    try {
      const token = await loadUserGithubToken(userId);
      const applied = await addIssueLabels({
        token,
        owner: repo.owner,
        name: repo.name,
        number: issue.number,
        labels: data.labels,
      });
      const url = `${repo.html_url}/issues/${issue.number}`;
      await recordEvent({
        userId,
        repositoryId: triage.repository_id,
        targetType: "issue_labels",
        targetId: String(issue.number),
        sourceType: "issue_triage",
        sourceId: triage.id,
        status: "success",
        githubUrl: url,
        metadata: { labels: applied.map((l) => l.name) },
      });
      await logAudit(userId, "github.issue_labels.success", "issue", triage.issue_id, {
        triage_id: triage.id,
        applied: applied.map((l) => l.name),
      });
      return { ok: true, applied: applied.map((l) => l.name), githubUrl: url } as const;
    } catch (err) {
      const message = (err as Error).message;
      await recordEvent({
        userId,
        repositoryId: triage.repository_id,
        targetType: "issue_labels",
        targetId: String(issue.number),
        sourceType: "issue_triage",
        sourceId: triage.id,
        status: "failed",
        errorMessage: message,
      });
      await logAudit(userId, "github.issue_labels.failed", "issue", triage.issue_id, {
        triage_id: triage.id,
        error: message,
      });
      throw err;
    }
  });

// ─── PR comment ─────────────────────────────────────────────────────────────

/** Build the public-facing Markdown body for a PR summary comment. */
export function formatPrSummaryComment(args: {
  plainEnglishSummary?: string;
  suggestedReviewFocus?: string[];
  testingNotes?: string[];
  securityNotes?: string[];
  missingContext?: string[];
}): string {
  const sections: string[] = [
    "## MaintainerOS AI Review Summary",
    "",
    "> _AI-drafted summary, reviewed and approved by a maintainer before posting._",
    "",
  ];
  if (args.plainEnglishSummary) {
    sections.push("### Summary", args.plainEnglishSummary, "");
  }
  if (args.suggestedReviewFocus?.length) {
    sections.push(
      "### Suggested review focus",
      ...args.suggestedReviewFocus.map((s) => `- ${s}`),
      "",
    );
  }
  if (args.testingNotes?.length) {
    sections.push("### Testing notes", ...args.testingNotes.map((s) => `- ${s}`), "");
  }
  if (args.securityNotes?.length) {
    sections.push("### Security notes", ...args.securityNotes.map((s) => `- ${s}`), "");
  }
  if (args.missingContext?.length) {
    sections.push("### Missing context", ...args.missingContext.map((s) => `- ${s}`), "");
  }
  sections.push("---", "_Posted via MaintainerOS after maintainer approval._");
  return sections.join("\n");
}

export const publishPrSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        summary_id: z.string().uuid(),
        confirm: z.literal(true),
        allow_repost: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { data: summary, error: sErr } = await context.supabase
      .from("pull_request_ai_summaries")
      .select("id, pull_request_id, repository_id, result, approval_status")
      .eq("id", data.summary_id)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!summary) throw new Error("AI summary not found.");
    if (!["approved", "edited"].includes(summary.approval_status)) {
      throw new Error("Only approved or edited summaries can be posted.");
    }
    await assertRepoAccess(userId, summary.repository_id);

    const { data: prior } = await supabaseAdmin
      .from("github_publish_events")
      .select("id, github_url, status")
      .eq("source_type", "pr_summary")
      .eq("source_id", summary.id)
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (prior && !data.allow_repost) {
      return { ok: false, alreadyPosted: true, previousUrl: prior.github_url } as const;
    }

    const repo = await loadRepo(summary.repository_id);
    const { data: pr } = await supabaseAdmin
      .from("pull_requests")
      .select("number")
      .eq("id", summary.pull_request_id)
      .maybeSingle();
    if (!pr) throw new Error("Pull request not found.");

    const { scopes, hasToken } = await loadUserScopes(userId);
    if (!evaluateWritePermissions(scopes, hasToken).canCommentPulls) {
      throw new Error(
        "Your GitHub session is missing write scope. Reconnect to grant repo access.",
      );
    }

    const result = (summary.result ?? {}) as Record<string, unknown>;
    const arr = (k: string) => (Array.isArray(result[k]) ? (result[k] as string[]) : undefined);
    const body = formatPrSummaryComment({
      plainEnglishSummary:
        typeof result.plainEnglishSummary === "string" ? result.plainEnglishSummary : undefined,
      suggestedReviewFocus: arr("suggestedReviewFocus"),
      testingNotes: arr("testingNotes"),
      securityNotes: arr("securityNotes"),
      missingContext: arr("missingContext"),
    });

    await recordEvent({
      userId,
      repositoryId: summary.repository_id,
      targetType: "pull_request",
      targetId: String(pr.number),
      sourceType: "pr_summary",
      sourceId: summary.id,
      status: "attempted",
    });
    await logAudit(
      userId,
      prior ? "github.pr_comment.reposted" : "github.pr_comment.attempted",
      "pull_request",
      summary.pull_request_id,
      { summary_id: summary.id, pr_number: pr.number },
    );

    try {
      const token = await loadUserGithubToken(userId);
      // PR comments are posted via the issues endpoint
      const comment = await postIssueComment({
        token,
        owner: repo.owner,
        name: repo.name,
        number: pr.number,
        body,
      });
      await recordEvent({
        userId,
        repositoryId: summary.repository_id,
        targetType: "pull_request",
        targetId: String(pr.number),
        sourceType: "pr_summary",
        sourceId: summary.id,
        status: "success",
        githubUrl: comment.html_url,
        metadata: { comment_id: comment.id, body_length: body.length },
      });
      await logAudit(userId, "github.pr_comment.success", "pull_request", summary.pull_request_id, {
        summary_id: summary.id,
        github_url: comment.html_url,
      });
      return { ok: true, githubUrl: comment.html_url } as const;
    } catch (err) {
      const message = (err as Error).message;
      await recordEvent({
        userId,
        repositoryId: summary.repository_id,
        targetType: "pull_request",
        targetId: String(pr.number),
        sourceType: "pr_summary",
        sourceId: summary.id,
        status: "failed",
        errorMessage: message,
      });
      await logAudit(userId, "github.pr_comment.failed", "pull_request", summary.pull_request_id, {
        summary_id: summary.id,
        error: message,
      });
      throw err;
    }
  });

// ─── Release draft ──────────────────────────────────────────────────────────

export const publishReleaseDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        draft_id: z.string().uuid(),
        confirm: z.literal(true),
        allow_repost: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { data: draft, error: dErr } = await context.supabase
      .from("release_drafts")
      .select("id, repository_id, version, title, body_markdown, status")
      .eq("id", data.draft_id)
      .maybeSingle();
    if (dErr) throw new Error(dErr.message);
    if (!draft) throw new Error("Release draft not found.");
    if (draft.status !== "approved") {
      throw new Error("Only approved release drafts can be published.");
    }
    if (!draft.version) throw new Error("Release draft is missing a version/tag.");
    if (!draft.body_markdown) throw new Error("Release draft body is empty.");
    await assertRepoAccess(userId, draft.repository_id);

    const { data: prior } = await supabaseAdmin
      .from("github_publish_events")
      .select("id, github_url, status")
      .eq("source_type", "release_draft")
      .eq("source_id", draft.id)
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (prior && !data.allow_repost) {
      return { ok: false, alreadyPosted: true, previousUrl: prior.github_url } as const;
    }

    const repo = await loadRepo(draft.repository_id);
    const { scopes, hasToken } = await loadUserScopes(userId);
    if (!evaluateWritePermissions(scopes, hasToken).canCreateReleases) {
      throw new Error(
        "Your GitHub session is missing write scope. Reconnect to grant repo access.",
      );
    }

    const tag = draft.version.startsWith("v") ? draft.version : `v${draft.version}`;
    const releaseName = draft.title || tag;

    await recordEvent({
      userId,
      repositoryId: draft.repository_id,
      targetType: "release",
      targetId: tag,
      sourceType: "release_draft",
      sourceId: draft.id,
      status: "attempted",
      metadata: { tag, draft: true },
    });
    await logAudit(
      userId,
      prior ? "github.release_draft.reposted" : "github.release_draft.attempted",
      "release",
      draft.id,
      { tag },
    );

    try {
      const token = await loadUserGithubToken(userId);
      const release = await createRelease({
        token,
        owner: repo.owner,
        name: repo.name,
        tag_name: tag,
        release_name: releaseName,
        body: draft.body_markdown,
      });
      await recordEvent({
        userId,
        repositoryId: draft.repository_id,
        targetType: "release",
        targetId: tag,
        sourceType: "release_draft",
        sourceId: draft.id,
        status: "success",
        githubUrl: release.html_url,
        metadata: { release_id: release.id, draft: release.draft, tag: release.tag_name },
      });
      await logAudit(userId, "github.release_draft.success", "release", draft.id, {
        tag,
        github_url: release.html_url,
      });
      return { ok: true, githubUrl: release.html_url, draft: release.draft } as const;
    } catch (err) {
      const message = (err as Error).message;
      await recordEvent({
        userId,
        repositoryId: draft.repository_id,
        targetType: "release",
        targetId: tag,
        sourceType: "release_draft",
        sourceId: draft.id,
        status: "failed",
        errorMessage: message,
      });
      await logAudit(userId, "github.release_draft.failed", "release", draft.id, {
        tag,
        error: message,
      });
      throw err;
    }
  });

// ─── Listing ────────────────────────────────────────────────────────────────

export const listPublishEventsForSource = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        source_type: z.enum(["issue_triage", "pr_summary", "release_draft"]),
        source_id: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("github_publish_events")
      .select("id, status, target_type, target_id, github_url, error_message, created_at")
      .eq("source_type", data.source_type)
      .eq("source_id", data.source_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { events: rows ?? [] };
  });

export const getPublishEventForAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        source_type: z.enum(["issue_triage", "pr_summary", "release_draft"]),
        source_id: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("github_publish_events")
      .select(
        "id, status, source_type, source_id, target_type, target_id, github_url, error_message, github_response_metadata, repository_id, user_id, created_at",
      )
      .eq("source_type", data.source_type)
      .eq("source_id", data.source_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { event: row ?? null };
  });

export const listPublishEventsForRepo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        repository_id: z.string().uuid(),
        limit: z.number().int().min(1).max(500).default(100),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("github_publish_events")
      .select(
        "id, status, source_type, source_id, target_type, target_id, github_url, error_message, created_at",
      )
      .eq("repository_id", data.repository_id)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return { events: rows ?? [] };
  });
