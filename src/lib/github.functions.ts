import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  loadUserGithubToken,
  listMyRepos,
  fetchRepo,
  listIssues,
  listPulls,
  listContributors,
  listLabels,
  listCommits,
} from "./github/api.server";
import type { GithubRepoListItem, RepoDTO, SyncJobDTO } from "./github/types";

/** Persist the GitHub provider token after OAuth. */
export const persistGithubToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        access_token: z.string().min(10).max(500),
        refresh_token: z.string().max(500).optional().nullable(),
        scopes: z.string().max(500).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { error } = await supabaseAdmin
      .from("user_github_tokens")
      .upsert({
        user_id: userId,
        access_token: data.access_token,
        refresh_token: data.refresh_token ?? null,
        scopes: data.scopes ?? null,
        updated_at: new Date().toISOString(),
      });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      action: "github.token.persisted",
      target_type: "user",
      target_id: userId,
      metadata: { scopes: data.scopes ?? null },
    });
    return { ok: true };
  });

/** Check whether the current user has any connected repositories. */
export const getOnboardingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count, error } = await supabaseAdmin
      .from("repository_memberships")
      .select("*", { count: "exact", head: true })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const { data: tok } = await supabaseAdmin
      .from("user_github_tokens")
      .select("user_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    return {
      connectedRepoCount: count ?? 0,
      hasToken: !!tok,
    };
  });

/** List all the signed-in user's GitHub repos for the onboarding picker. */
export const listGithubRepos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ repos: GithubRepoListItem[] }> => {
    const token = await loadUserGithubToken(context.userId);
    const raw = await listMyRepos(token);
    const repos = raw.map((r) => ({
      github_id: r.id,
      owner: r.owner.login,
      name: r.name,
      full_name: r.full_name,
      description: r.description,
      stars: r.stargazers_count,
      forks: r.forks_count,
      primary_language: r.language,
      visibility: r.visibility,
      is_private: r.private,
      open_issues: r.open_issues_count,
      pushed_at: r.pushed_at,
      default_branch: r.default_branch,
      html_url: r.html_url,
    }));
    return { repos };
  });

/** Connect (or re-connect) a set of GitHub repos to the user. */
export const connectRepositories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        github_ids: z.array(z.number().int().positive()).min(1).max(50),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const token = await loadUserGithubToken(context.userId);
    const connected: string[] = [];
    for (const githubId of data.github_ids) {
      // Get full repo metadata via listMyRepos cache or fetch one-by-one.
      // To save calls, we re-fetch only what we don't have.
      const { data: existing } = await supabaseAdmin
        .from("repositories")
        .select("id, owner, name")
        .eq("github_id", githubId)
        .maybeSingle();

      let repoId = existing?.id;
      if (!repoId) {
        // Pull repo info — we need owner/name; cheapest is to find it in the user's list.
        const list = await listMyRepos(token);
        const match = list.find((r) => r.id === githubId);
        if (!match) continue;
        const ins = await supabaseAdmin
          .from("repositories")
          .insert({
            github_id: match.id,
            owner: match.owner.login,
            name: match.name,
            full_name: match.full_name,
            description: match.description,
            stars: match.stargazers_count,
            forks: match.forks_count,
            primary_language: match.language,
            visibility: match.visibility,
            open_issues: match.open_issues_count,
            pushed_at: match.pushed_at,
            default_branch: match.default_branch,
            html_url: match.html_url,
          })
          .select("id")
          .single();
        if (ins.error) throw new Error(ins.error.message);
        repoId = ins.data.id;
      }
      await supabaseAdmin
        .from("repository_memberships")
        .upsert({ user_id: context.userId, repository_id: repoId });
      connected.push(repoId);
    }
    await supabaseAdmin.from("audit_logs").insert({
      user_id: context.userId,
      action: "repos.connected",
      target_type: "repositories",
      metadata: { count: connected.length, github_ids: data.github_ids },
    });
    return { connected };
  });

/** Disconnect a repo from the current user. */
export const disconnectRepository = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ repository_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("repository_memberships")
      .delete()
      .eq("user_id", context.userId)
      .eq("repository_id", data.repository_id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_logs").insert({
      user_id: context.userId,
      action: "repos.disconnected",
      target_type: "repository",
      target_id: data.repository_id,
    });
    return { ok: true };
  });

/** List repositories the current user has connected. */
export const listConnectedRepos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ repos: RepoDTO[] }> => {
    const { data, error } = await supabaseAdmin
      .from("repository_memberships")
      .select(
        "repository:repositories(id, github_id, owner, name, full_name, description, stars, forks, primary_language, visibility, open_issues, pushed_at, default_branch, html_url)",
      )
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const repos = (data ?? [])
      .map((row) => row.repository as unknown as RepoDTO | null)
      .filter((r): r is RepoDTO => !!r);
    return { repos };
  });

/** Run a sync job for one connected repository. */
export const syncRepository = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ repository_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<SyncJobDTO> => {
    const userId = context.userId;

    // Confirm user owns the membership.
    const { data: member } = await supabaseAdmin
      .from("repository_memberships")
      .select("repository_id")
      .eq("user_id", userId)
      .eq("repository_id", data.repository_id)
      .maybeSingle();
    if (!member) throw new Error("Repository is not connected to your account.");

    const { data: repo, error: repoErr } = await supabaseAdmin
      .from("repositories")
      .select("id, owner, name")
      .eq("id", data.repository_id)
      .single();
    if (repoErr || !repo) throw new Error("Repository not found.");

    const { data: jobRow, error: jobErr } = await supabaseAdmin
      .from("sync_jobs")
      .insert({
        repository_id: repo.id,
        user_id: userId,
        status: "running",
      })
      .select("*")
      .single();
    if (jobErr) throw new Error(jobErr.message);

    const token = await loadUserGithubToken(userId);
    let issuesSynced = 0;
    let prsSynced = 0;
    let contribsSynced = 0;
    let commitsSynced = 0;
    let labelsSynced = 0;
    let errorMsg: string | null = null;

    try {
      const [meta, issues, pulls, contribs, labels, commits] = await Promise.all([
        fetchRepo(token, repo.owner, repo.name),
        listIssues(token, repo.owner, repo.name),
        listPulls(token, repo.owner, repo.name),
        listContributors(token, repo.owner, repo.name),
        listLabels(token, repo.owner, repo.name),
        listCommits(token, repo.owner, repo.name),
      ]);

      await supabaseAdmin
        .from("repositories")
        .update({
          description: meta.description,
          stars: meta.stargazers_count,
          forks: meta.forks_count,
          primary_language: meta.language,
          visibility: meta.visibility,
          open_issues: meta.open_issues_count,
          pushed_at: meta.pushed_at,
          default_branch: meta.default_branch,
          html_url: meta.html_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", repo.id);

      if (issues.length) {
        const rows = issues.map((i) => ({
          repository_id: repo.id,
          github_id: i.id,
          number: i.number,
          title: i.title,
          state: i.state,
          author_login: i.user?.login ?? null,
          author_avatar: i.user?.avatar_url ?? null,
          labels: i.labels.map((l) => ({ name: l.name, color: l.color })),
          comments: i.comments,
          body: i.body,
          created_at: i.created_at,
          updated_at: i.updated_at,
          closed_at: i.closed_at,
        }));
        const { error } = await supabaseAdmin
          .from("issues")
          .upsert(rows, { onConflict: "repository_id,github_id" });
        if (error) throw new Error(`issues: ${error.message}`);
        issuesSynced = rows.length;
      }

      if (pulls.length) {
        const rows = pulls.map((p) => ({
          repository_id: repo.id,
          github_id: p.id,
          number: p.number,
          title: p.title,
          state: p.state,
          author_login: p.user?.login ?? null,
          author_avatar: p.user?.avatar_url ?? null,
          additions: p.additions ?? 0,
          deletions: p.deletions ?? 0,
          changed_files: p.changed_files ?? 0,
          draft: p.draft,
          body: p.body,
          created_at: p.created_at,
          updated_at: p.updated_at,
          merged_at: p.merged_at,
          closed_at: p.closed_at,
        }));
        const { error } = await supabaseAdmin
          .from("pull_requests")
          .upsert(rows, { onConflict: "repository_id,github_id" });
        if (error) throw new Error(`pulls: ${error.message}`);
        prsSynced = rows.length;
      }

      if (contribs.length) {
        await supabaseAdmin.from("contributors").delete().eq("repository_id", repo.id);
        const rows = contribs.map((c) => ({
          repository_id: repo.id,
          login: c.login,
          avatar_url: c.avatar_url,
          contributions: c.contributions,
        }));
        const { error } = await supabaseAdmin.from("contributors").insert(rows);
        if (error) throw new Error(`contribs: ${error.message}`);
        contribsSynced = rows.length;
      }

      if (labels.length) {
        await supabaseAdmin.from("labels").delete().eq("repository_id", repo.id);
        const rows = labels.map((l) => ({
          repository_id: repo.id,
          name: l.name,
          color: l.color,
          description: l.description,
        }));
        const { error } = await supabaseAdmin.from("labels").insert(rows);
        if (error) throw new Error(`labels: ${error.message}`);
        labelsSynced = rows.length;
      }

      if (commits.length) {
        const rows = commits.map((c) => ({
          repository_id: repo.id,
          sha: c.sha,
          author_login: c.author?.login ?? null,
          author_avatar: c.author?.avatar_url ?? null,
          message: c.commit.message,
          committed_at: c.commit.author?.date ?? null,
        }));
        const { error } = await supabaseAdmin
          .from("commits")
          .upsert(rows, { onConflict: "repository_id,sha" });
        if (error) throw new Error(`commits: ${error.message}`);
        commitsSynced = rows.length;
      }
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    }

    const finishedAt = new Date().toISOString();
    const status = errorMsg ? "error" : "success";

    const { data: updated, error: updErr } = await supabaseAdmin
      .from("sync_jobs")
      .update({
        status,
        finished_at: finishedAt,
        issues_synced: issuesSynced,
        prs_synced: prsSynced,
        contributors_synced: contribsSynced,
        commits_synced: commitsSynced,
        labels_synced: labelsSynced,
        error: errorMsg,
      })
      .eq("id", jobRow.id)
      .select("*")
      .single();
    if (updErr) throw new Error(updErr.message);

    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      action: status === "success" ? "repo.synced" : "repo.sync_failed",
      target_type: "repository",
      target_id: repo.id,
      metadata: {
        issues: issuesSynced,
        prs: prsSynced,
        contribs: contribsSynced,
        commits: commitsSynced,
        labels: labelsSynced,
        error: errorMsg,
      },
    });

    return {
      id: updated.id,
      repository_id: updated.repository_id,
      status: updated.status as SyncJobDTO["status"],
      started_at: updated.started_at,
      finished_at: updated.finished_at,
      issues_synced: updated.issues_synced ?? 0,
      prs_synced: updated.prs_synced ?? 0,
      contributors_synced: updated.contributors_synced ?? 0,
      commits_synced: updated.commits_synced ?? 0,
      labels_synced: updated.labels_synced ?? 0,
      error: updated.error,
    };
  });

/** Get the latest sync job for a repository (or null). */
export const getLatestSync = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ repository_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ job: SyncJobDTO | null }> => {
    const { data: row, error } = await supabaseAdmin
      .from("sync_jobs")
      .select("*")
      .eq("repository_id", data.repository_id)
      .eq("user_id", context.userId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { job: null };
    return {
      job: {
        id: row.id,
        repository_id: row.repository_id,
        status: row.status as SyncJobDTO["status"],
        started_at: row.started_at,
        finished_at: row.finished_at,
        issues_synced: row.issues_synced ?? 0,
        prs_synced: row.prs_synced ?? 0,
        contributors_synced: row.contributors_synced ?? 0,
        commits_synced: row.commits_synced ?? 0,
        labels_synced: row.labels_synced ?? 0,
        error: row.error,
      },
    };
  });

/** Pull issues for a connected repo (RLS-scoped). */
export const fetchIssues = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ repository_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("issues")
      .select(
        "id, number, title, state, author_login, author_avatar, labels, comments, created_at, updated_at, closed_at",
      )
      .eq("repository_id", data.repository_id)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { issues: rows ?? [] };
  });

/** Pull PRs for a connected repo. */
export const fetchPulls = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ repository_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("pull_requests")
      .select(
        "id, number, title, state, author_login, author_avatar, additions, deletions, changed_files, draft, created_at, updated_at, merged_at, closed_at",
      )
      .eq("repository_id", data.repository_id)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { pulls: rows ?? [] };
  });

/** Pull contributors for a connected repo. */
export const fetchContributors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ repository_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("contributors")
      .select("login, avatar_url, contributions")
      .eq("repository_id", data.repository_id)
      .order("contributions", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { contributors: rows ?? [] };
  });

/** Pull labels for a connected repo. */
export const fetchLabels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ repository_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("labels")
      .select("name, color, description")
      .eq("repository_id", data.repository_id)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return { labels: rows ?? [] };
  });

/** Aggregate inputs for the health score. */
export const getRepoHealthInputs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ repository_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const repoId = data.repository_id;
    const [issuesRes, prsRes, contribsRes, labelsRes, commitsRes] = await Promise.all([
      context.supabase
        .from("issues")
        .select("state, created_at, updated_at, closed_at, comments")
        .eq("repository_id", repoId)
        .limit(500),
      context.supabase
        .from("pull_requests")
        .select("state, created_at, updated_at, merged_at, closed_at, draft")
        .eq("repository_id", repoId)
        .limit(500),
      context.supabase
        .from("contributors")
        .select("login, contributions")
        .eq("repository_id", repoId),
      context.supabase
        .from("labels")
        .select("name")
        .eq("repository_id", repoId),
      context.supabase
        .from("commits")
        .select("committed_at")
        .eq("repository_id", repoId)
        .order("committed_at", { ascending: false })
        .limit(100),
    ]);
    return {
      issues: issuesRes.data ?? [],
      pulls: prsRes.data ?? [],
      contributors: contribsRes.data ?? [],
      labels: labelsRes.data ?? [],
      commits: commitsRes.data ?? [],
    };
  });
