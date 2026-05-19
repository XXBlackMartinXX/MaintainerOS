// Server-only GitHub write helpers. Never import from client code.
import { GitHubError } from "./client.server";

const GITHUB_API = "https://api.github.com";

async function ghWrite<T>(
  path: string,
  opts: { token: string; method: "POST" | "PATCH" | "PUT"; body: unknown },
): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    method: opts.method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${opts.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "MaintainerOS",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(opts.body),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const j = (await res.json()) as { message?: string };
      detail = j.message ? ` — ${j.message}` : "";
    } catch { /* ignore */ }
    throw new GitHubError(`GitHub ${res.status} on ${path}${detail}`, res.status);
  }
  return (await res.json()) as T;
}

export type GhComment = { id: number; html_url: string; body: string; created_at: string };
export type GhRelease = {
  id: number;
  html_url: string;
  tag_name: string;
  name: string;
  draft: boolean;
  body: string;
};

export async function postIssueComment(args: {
  token: string;
  owner: string;
  name: string;
  number: number;
  body: string;
}): Promise<GhComment> {
  return ghWrite<GhComment>(
    `/repos/${args.owner}/${args.name}/issues/${args.number}/comments`,
    { token: args.token, method: "POST", body: { body: args.body } },
  );
}

export async function addIssueLabels(args: {
  token: string;
  owner: string;
  name: string;
  number: number;
  labels: string[];
}): Promise<Array<{ name: string }>> {
  return ghWrite<Array<{ name: string }>>(
    `/repos/${args.owner}/${args.name}/issues/${args.number}/labels`,
    { token: args.token, method: "POST", body: { labels: args.labels } },
  );
}

export async function createRelease(args: {
  token: string;
  owner: string;
  name: string;
  tag_name: string;
  release_name: string;
  body: string;
  target_commitish?: string;
}): Promise<GhRelease> {
  return ghWrite<GhRelease>(`/repos/${args.owner}/${args.name}/releases`, {
    token: args.token,
    method: "POST",
    body: {
      tag_name: args.tag_name,
      name: args.release_name,
      body: args.body,
      draft: true, // safety: never publish final releases in this slice
      prerelease: false,
      ...(args.target_commitish ? { target_commitish: args.target_commitish } : {}),
    },
  });
}

/** Parse the OAuth `scopes` string (space- or comma-separated). */
export function parseScopes(scopes: string | null | undefined): string[] {
  if (!scopes) return [];
  return scopes.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
}

export type WritePermissions = {
  hasToken: boolean;
  scopes: string[];
  canCommentIssues: boolean;
  canManageLabels: boolean;
  canCreateReleases: boolean;
  canCommentPulls: boolean;
};

export function evaluateWritePermissions(scopes: string[], hasToken: boolean): WritePermissions {
  const has = (s: string) => scopes.includes(s);
  const writeRepo = has("repo") || has("public_repo");
  return {
    hasToken,
    scopes,
    canCommentIssues: writeRepo,
    canManageLabels: writeRepo,
    canCommentPulls: writeRepo,
    canCreateReleases: writeRepo,
  };
}
