// Server-only GitHub REST client. Never import from client code.
// Uses fetch with auth header, parses Link headers for pagination,
// and surfaces rate-limit errors clearly.

const GITHUB_API = "https://api.github.com";

export class GitHubError extends Error {
  status: number;
  rateLimitRemaining?: number;
  rateLimitResetAt?: Date;
  constructor(message: string, status: number, info?: { remaining?: number; resetAt?: Date }) {
    super(message);
    this.status = status;
    this.rateLimitRemaining = info?.remaining;
    this.rateLimitResetAt = info?.resetAt;
  }
}

type FetchOpts = {
  token: string;
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
};

async function ghFetch(path: string, opts: FetchOpts): Promise<Response> {
  const url = new URL(path.startsWith("http") ? path : `${GITHUB_API}${path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${opts.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "MaintainerOS",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (!res.ok) {
    const remaining = Number(res.headers.get("x-ratelimit-remaining") ?? "");
    const reset = Number(res.headers.get("x-ratelimit-reset") ?? "");
    const resetAt = reset ? new Date(reset * 1000) : undefined;
    if ((res.status === 403 || res.status === 429) && remaining === 0) {
      throw new GitHubError(
        `GitHub rate limit exceeded${resetAt ? ` (resets at ${resetAt.toISOString()})` : ""}`,
        res.status,
        { remaining, resetAt },
      );
    }
    let detail = "";
    try {
      const j = (await res.json()) as { message?: string };
      detail = j.message ? ` — ${j.message}` : "";
    } catch {
      /* ignore */
    }
    throw new GitHubError(`GitHub ${res.status} on ${url.pathname}${detail}`, res.status);
  }
  return res;
}

export async function ghGet<T>(path: string, opts: FetchOpts): Promise<T> {
  const res = await ghFetch(path, opts);
  return (await res.json()) as T;
}

function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  // <https://api.github.com/...?page=2>; rel="next", ...
  const parts = linkHeader.split(",");
  for (const part of parts) {
    const m = part.match(/<([^>]+)>;\s*rel="next"/);
    if (m) return m[1];
  }
  return null;
}

export async function ghPaginate<T>(
  path: string,
  opts: FetchOpts & { perPage?: number; maxPages?: number },
): Promise<T[]> {
  const perPage = opts.perPage ?? 100;
  const maxPages = opts.maxPages ?? 5;
  const out: T[] = [];
  let next: string | null = null;
  let page = 0;

  let res = await ghFetch(path, {
    ...opts,
    query: { per_page: perPage, ...(opts.query ?? {}) },
  });
  out.push(...((await res.json()) as T[]));
  next = parseNextLink(res.headers.get("link"));
  page++;

  while (next && page < maxPages) {
    res = await ghFetch(next, { token: opts.token, signal: opts.signal });
    out.push(...((await res.json()) as T[]));
    next = parseNextLink(res.headers.get("link"));
    page++;
  }
  return out;
}
