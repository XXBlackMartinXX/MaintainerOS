import { demoRepos } from "@/lib/demo-data";

export type DemoConnectedRepo = {
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

export const demoConnectedRepos: DemoConnectedRepo[] = demoRepos.map((repo, index) => {
  const [owner, name] = repo.fullName.split("/");
  return {
    id: `demo-${repo.id}`,
    github_id: 900_000 + index,
    owner,
    name,
    full_name: repo.fullName,
    description: repo.description,
    stars: repo.stars,
    forks: repo.forks,
    primary_language: repo.language,
    visibility: "public",
    open_issues: repo.openIssues,
    pushed_at: new Date(Date.UTC(2026, 0, index + 2)).toISOString(),
    default_branch: "main",
    html_url: null,
  };
});