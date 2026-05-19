import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listConnectedRepos } from "@/lib/github.functions";

const STORAGE_KEY = "maintainer-os.selected-repo-id";
const EVENT = "maintainer-os:selected-repo-changed";

export type ConnectedRepo = {
  id: string;
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

function readStored(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setSelectedRepoId(id: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
  } catch {
    /* ignore */
  }
}

export function useConnectedRepos() {
  const fn = useServerFn(listConnectedRepos);
  return useQuery({
    queryKey: ["connected-repos"],
    queryFn: () => fn(),
    staleTime: 30_000,
  });
}

export function useSelectedRepo() {
  const { data, isLoading } = useConnectedRepos();
  const repos = (data?.repos ?? []) as ConnectedRepo[];
  const [storedId, setStoredId] = useState<string | null>(null);

  useEffect(() => {
    setStoredId(readStored());
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setStoredId(detail ?? readStored());
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  const select = useCallback((id: string) => {
    setStoredId(id);
    setSelectedRepoId(id);
  }, []);

  const selected = repos.find((r) => r.id === storedId) ?? repos[0] ?? null;

  return {
    repos,
    selected,
    select,
    isLoading,
    hasConnectedRepo: repos.length > 0,
  };
}
