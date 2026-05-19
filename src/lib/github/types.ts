// Client-safe DTOs returned by server functions. No secrets, no tokens.

export type RepoDTO = {
  id: string; // our internal uuid
  github_id: number;
  owner: string;
  name: string;
  full_name: string;
  description: string | null;
  stars: number;
  forks: number;
  primary_language: string | null;
  visibility: string | null;
  open_issues: number;
  pushed_at: string | null;
  default_branch: string | null;
  html_url: string | null;
};

export type GithubRepoListItem = {
  github_id: number;
  owner: string;
  name: string;
  full_name: string;
  description: string | null;
  stars: number;
  forks: number;
  primary_language: string | null;
  visibility: string;
  open_issues: number;
  pushed_at: string | null;
  default_branch: string | null;
  html_url: string;
  is_private: boolean;
};

export type SyncJobDTO = {
  id: string;
  repository_id: string;
  status: "pending" | "running" | "success" | "error";
  started_at: string;
  finished_at: string | null;
  issues_synced: number;
  prs_synced: number;
  contributors_synced: number;
  commits_synced: number;
  labels_synced: number;
  error: string | null;
};
