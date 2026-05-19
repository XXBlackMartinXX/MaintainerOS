// Server-only GitHub endpoint wrappers + token loader.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ghGet, ghPaginate } from "./client.server";

export type GhRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  owner: { login: string; avatar_url: string };
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  visibility: string;
  private: boolean;
  open_issues_count: number;
  pushed_at: string | null;
  default_branch: string;
  html_url: string;
};

export type GhIssue = {
  id: number;
  number: number;
  title: string;
  state: string;
  user: { login: string; avatar_url: string } | null;
  labels: Array<{ name: string; color: string }>;
  comments: number;
  body: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  pull_request?: unknown; // present means it's a PR, skip
};

export type GhPull = {
  id: number;
  number: number;
  title: string;
  state: string;
  user: { login: string; avatar_url: string } | null;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  draft: boolean;
  body: string | null;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
};

export type GhContributor = {
  login: string;
  avatar_url: string;
  contributions: number;
};

export type GhLabel = {
  name: string;
  color: string;
  description: string | null;
};

export type GhCommit = {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string } | null;
  };
  author: { login: string; avatar_url: string } | null;
};

export async function loadUserGithubToken(userId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("user_github_tokens")
    .select("access_token")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load GitHub token: ${error.message}`);
  if (!data?.access_token) {
    throw new Error(
      "No GitHub access token found. Please sign in with GitHub again to grant repository access.",
    );
  }
  return data.access_token;
}

export async function listMyRepos(token: string): Promise<GhRepo[]> {
  return ghPaginate<GhRepo>("/user/repos", {
    token,
    query: { sort: "updated", affiliation: "owner,collaborator,organization_member" },
    perPage: 100,
    maxPages: 3,
  });
}

export async function fetchRepo(token: string, owner: string, name: string): Promise<GhRepo> {
  return ghGet<GhRepo>(`/repos/${owner}/${name}`, { token });
}

export async function listIssues(token: string, owner: string, name: string): Promise<GhIssue[]> {
  // GitHub's issues endpoint returns both issues and PRs; we filter PRs out.
  const all = await ghPaginate<GhIssue>(`/repos/${owner}/${name}/issues`, {
    token,
    query: { state: "all" },
    perPage: 100,
    maxPages: 2,
  });
  return all.filter((i) => !("pull_request" in i) || !i.pull_request);
}

export async function listPulls(token: string, owner: string, name: string): Promise<GhPull[]> {
  return ghPaginate<GhPull>(`/repos/${owner}/${name}/pulls`, {
    token,
    query: { state: "all", sort: "updated", direction: "desc" },
    perPage: 100,
    maxPages: 1,
  });
}

export async function listContributors(
  token: string,
  owner: string,
  name: string,
): Promise<GhContributor[]> {
  return ghPaginate<GhContributor>(`/repos/${owner}/${name}/contributors`, {
    token,
    perPage: 100,
    maxPages: 1,
  });
}

export async function listLabels(token: string, owner: string, name: string): Promise<GhLabel[]> {
  return ghPaginate<GhLabel>(`/repos/${owner}/${name}/labels`, {
    token,
    perPage: 100,
    maxPages: 1,
  });
}

export async function listCommits(token: string, owner: string, name: string): Promise<GhCommit[]> {
  return ghPaginate<GhCommit>(`/repos/${owner}/${name}/commits`, {
    token,
    perPage: 50,
    maxPages: 1,
  });
}
