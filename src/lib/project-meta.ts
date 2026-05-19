/**
 * Central project metadata. Replace https://github.com/XXBlackMartinXX/MaintainerOS placeholders before
 * publishing the public repository. Used by landing page, footer, Trust
 * Center, Settings, and QA Checklist.
 */

export const PROJECT_META = {
  projectName: "MaintainerOS",
  tagline: "An honest, AI-assisted operations center for open-source maintainers.",
  version: "0.1.0",

  // Replace these with the real public repo URL once the repository is published.
  repoUrl: "https://github.com/XXBlackMartinXX/MaintainerOS",
  docsUrl: "https://github.com/XXBlackMartinXX/MaintainerOS/tree/main/docs",
  licenseUrl: "https://github.com/XXBlackMartinXX/MaintainerOS/blob/main/LICENSE",
  securityUrl: "https://github.com/XXBlackMartinXX/MaintainerOS/blob/main/SECURITY.md",
  codeOfConductUrl: "https://github.com/XXBlackMartinXX/MaintainerOS/blob/main/CODE_OF_CONDUCT.md",
  contributingUrl: "https://github.com/XXBlackMartinXX/MaintainerOS/blob/main/CONTRIBUTING.md",
  changelogUrl: "https://github.com/XXBlackMartinXX/MaintainerOS/blob/main/CHANGELOG.md",
  releaseNotesUrl: "https://github.com/XXBlackMartinXX/MaintainerOS/releases/tag/v0.1.0",

  // Demo deployment URL — replace once a public preview is live.
  demoUrl: "TODO_PUBLIC_DEMO_URL",
} as const;

export type ProjectMeta = typeof PROJECT_META;
