/**
 * Central project metadata. Replace TODO_PUBLIC_REPO_URL placeholders before
 * publishing the public repository. Used by landing page, footer, Trust
 * Center, Settings, and QA Checklist.
 */

export const PROJECT_META = {
  projectName: "MaintainerOS",
  tagline: "An honest, AI-assisted operations center for open-source maintainers.",
  version: "0.1.0",

  // Replace these with the real public repo URL once the repository is published.
  repoUrl: "TODO_PUBLIC_REPO_URL",
  docsUrl: "TODO_PUBLIC_REPO_URL/tree/main/docs",
  licenseUrl: "TODO_PUBLIC_REPO_URL/blob/main/LICENSE",
  securityUrl: "TODO_PUBLIC_REPO_URL/blob/main/SECURITY.md",
  codeOfConductUrl: "TODO_PUBLIC_REPO_URL/blob/main/CODE_OF_CONDUCT.md",
  contributingUrl: "TODO_PUBLIC_REPO_URL/blob/main/CONTRIBUTING.md",
  changelogUrl: "TODO_PUBLIC_REPO_URL/blob/main/CHANGELOG.md",
  releaseNotesUrl: "TODO_PUBLIC_REPO_URL/releases/tag/v0.1.0",

  // Demo deployment URL — replace once a public preview is live.
  demoUrl: "TODO_PUBLIC_DEMO_URL",
} as const;

export type ProjectMeta = typeof PROJECT_META;
