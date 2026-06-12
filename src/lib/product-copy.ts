/**
 * Central product copy / labels.
 *
 * Use these constants for user-facing language that conveys safety
 * guarantees (or the absence of them). Keeping them centralized makes
 * it harder for individual edits to drift into overclaiming language
 * ("production-ready", "secure", "verified") and lets us pin the
 * wording with copy-invariant tests.
 *
 * Rules of thumb:
 *  - AI output is always a draft until a human approves it.
 *  - Readiness/security/health checks are advisory signals, not audits.
 *  - Demo mode is sample data and never touches GitHub or live AI.
 *  - This project is a public preview, not a production-certified app.
 */

export const PRODUCT_LABELS = {
  aiDraft: "AI draft",
  humanApproval: "Human approval required",
  advisory: "Advisory signal",
  publicPreview: "Public preview",
  demoData: "Demo data",
  notAudit: "Not a formal security audit",
  verifyBeforePublishing: "Verify before publishing",
  draftRelease: "Draft release",
  setupRequired: "Setup required",
  liveRepository: "Live repository",
  sensitiveRepoWarning: "Sensitive repositories are not recommended yet",
} as const;

export const PRODUCT_COPY = {
  // Surfaces
  advisoryHeuristic:
    "Advisory signal only — heuristic checks based on synced metadata. Not a substitute for a manual review.",
  advisorySecurity:
    "Advisory signals only — these checks are heuristic and are not a substitute for a security review. Verify before relying on any result.",
  advisoryReadiness:
    "Advisory checklist of basics every healthy open-source project should have. Heuristic signals only — not a substitute for a manual review.",

  // Demo / preview
  demoBannerHeadline: "Demo mode active.",
  demoBannerBody:
    "All repositories, issues, PRs and AI outputs shown are illustrative sample data. Publishing and GitHub sync are disabled.",
  publicPreviewNotice:
    "MaintainerOS is a public preview. Do not connect sensitive or production-critical repositories yet.",

  // Approval / publishing
  publishRequiresApproval:
    "Every GitHub write requires explicit human approval and an additional confirmation step.",
  releasesAreDraftsOnly:
    "Releases are always created as drafts. MaintainerOS never publishes a release for you.",
  aiCannotPublish:
    "AI suggestions are drafts. The AI cannot post to GitHub, label issues, or publish releases on its own.",

  // Empty / setup
  setupRequiredHeadline: "Setup required",
  setupRequiredBody:
    "Some configuration is missing. Visit setup diagnostics to see exactly what to set, without exposing any secret values.",
  noRepositoryBody:
    "Connect a GitHub repository to start syncing live issues, pull requests, and contributors. Prefer to look around first? Try demo mode — it uses sample data only.",
  aiUnavailableBody:
    "AI features are unavailable in this environment. Drafts cannot be generated until the managed AI gateway is configured.",

  // Errors
  configErrorPrefix:
    "This looks like a configuration problem, not a bug in the app.",
  genericErrorPrefix: "Something went wrong while loading this page.",
} as const;

/** Words/phrases we never want to ship in user-facing surfaces. */
export const FORBIDDEN_COPY = [
  "production-ready",
  "production ready",
  "enterprise-grade",
  "bank-grade",
  "military-grade",
  "guaranteed",
  "guarantee secure",
  "AI will fix",
  "AI will publish",
  "automatic publishing",
  "auto-publish",
  "fully audited",
  "SOC 2 certified",
  "penetration tested",
] as const;

export type ProductLabel = keyof typeof PRODUCT_LABELS;
export type ProductCopy = keyof typeof PRODUCT_COPY;
