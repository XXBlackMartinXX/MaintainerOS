// Demo data for MaintainerOS — clearly labeled, not from real GitHub.
// Replace with live GitHub API once OAuth + sync are wired.

export const IS_DEMO = true;

export type DemoRepo = {
  id: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  health: number;
};

export const demoRepos: DemoRepo[] = [
  {
    id: "1",
    fullName: "acme/atlas",
    description: "Distributed task graph engine for data teams.",
    stars: 4821,
    forks: 312,
    openIssues: 47,
    language: "TypeScript",
    health: 82,
  },
  {
    id: "2",
    fullName: "acme/lumen",
    description: "Realtime observability for serverless workloads.",
    stars: 1290,
    forks: 88,
    openIssues: 23,
    language: "Rust",
    health: 71,
  },
  {
    id: "3",
    fullName: "acme/prism-ui",
    description: "Accessible React component primitives.",
    stars: 9180,
    forks: 612,
    openIssues: 104,
    language: "TypeScript",
    health: 64,
  },
];

export const demoIssueVolume = [
  { week: "W1", opened: 18, closed: 12 },
  { week: "W2", opened: 24, closed: 21 },
  { week: "W3", opened: 16, closed: 19 },
  { week: "W4", opened: 31, closed: 22 },
  { week: "W5", opened: 22, closed: 27 },
  { week: "W6", opened: 28, closed: 25 },
  { week: "W7", opened: 19, closed: 24 },
  { week: "W8", opened: 26, closed: 30 },
];

export const demoMergeTime = [
  { week: "W1", hours: 38 },
  { week: "W2", hours: 32 },
  { week: "W3", hours: 41 },
  { week: "W4", hours: 28 },
  { week: "W5", hours: 24 },
  { week: "W6", hours: 22 },
  { week: "W7", hours: 26 },
  { week: "W8", hours: 19 },
];

export const demoContributorActivity = [
  { day: "Mon", commits: 12, prs: 4, reviews: 8 },
  { day: "Tue", commits: 18, prs: 6, reviews: 11 },
  { day: "Wed", commits: 22, prs: 9, reviews: 14 },
  { day: "Thu", commits: 16, prs: 7, reviews: 12 },
  { day: "Fri", commits: 20, prs: 5, reviews: 10 },
  { day: "Sat", commits: 6, prs: 2, reviews: 3 },
  { day: "Sun", commits: 4, prs: 1, reviews: 2 },
];

export const demoLabelDistribution = [
  { name: "bug", value: 34 },
  { name: "feature", value: 28 },
  { name: "docs", value: 18 },
  { name: "question", value: 12 },
  { name: "security", value: 8 },
];

export type DemoIssue = {
  id: string;
  number: number;
  title: string;
  author: string;
  state: "open" | "closed";
  comments: number;
  ageDays: number;
  ai: {
    type: "bug" | "feature" | "docs" | "security" | "question" | "duplicate";
    severity: "low" | "medium" | "high" | "critical";
    priority: "P0" | "P1" | "P2" | "P3";
    complexity: "small" | "medium" | "large";
    sentiment: "positive" | "neutral" | "negative";
    suggestedLabels: string[];
    needsMaintainer: boolean;
    confidence: number;
    summary: string;
  };
};

export const demoIssues: DemoIssue[] = [
  {
    id: "i1",
    number: 1284,
    title: "Memory leak when streaming large payloads",
    author: "marin-dev",
    state: "open",
    comments: 12,
    ageDays: 3,
    ai: {
      type: "bug",
      severity: "high",
      priority: "P1",
      complexity: "medium",
      sentiment: "neutral",
      suggestedLabels: ["bug", "performance", "needs-repro"],
      needsMaintainer: true,
      confidence: 0.82,
      summary:
        "Reporter observes growing RSS over 30 minutes under load on v4.2.x. Likely related to retained stream buffers in the websocket adapter.",
    },
  },
  {
    id: "i2",
    number: 1283,
    title: "Add TypeScript generics to createClient<T>",
    author: "lin-ada",
    state: "open",
    comments: 4,
    ageDays: 1,
    ai: {
      type: "feature",
      severity: "low",
      priority: "P2",
      complexity: "small",
      sentiment: "positive",
      suggestedLabels: ["enhancement", "typescript", "good-first-issue"],
      needsMaintainer: false,
      confidence: 0.74,
      summary:
        "Request to parameterize the client factory with a generic type to improve inference for downstream method signatures.",
    },
  },
  {
    id: "i3",
    number: 1280,
    title: "Docs: getting-started example throws on Node 22",
    author: "okafor-r",
    state: "open",
    comments: 7,
    ageDays: 5,
    ai: {
      type: "docs",
      severity: "medium",
      priority: "P2",
      complexity: "small",
      sentiment: "neutral",
      suggestedLabels: ["docs", "good-first-issue"],
      needsMaintainer: false,
      confidence: 0.88,
      summary:
        "Example uses deprecated assert syntax. Update to use node:test and verify against Node 20 and 22.",
    },
  },
  {
    id: "i4",
    number: 1277,
    title: "Possible prototype pollution in config merge",
    author: "sec-watcher",
    state: "open",
    comments: 2,
    ageDays: 2,
    ai: {
      type: "security",
      severity: "critical",
      priority: "P0",
      complexity: "medium",
      sentiment: "neutral",
      suggestedLabels: ["security", "needs-triage"],
      needsMaintainer: true,
      confidence: 0.61,
      summary:
        "Low-confidence signal. Review recommended before public discussion. Suggest moving to a private security advisory.",
    },
  },
  {
    id: "i5",
    number: 1271,
    title: "How do I disable the cache layer?",
    author: "newbie-42",
    state: "open",
    comments: 1,
    ageDays: 6,
    ai: {
      type: "question",
      severity: "low",
      priority: "P3",
      complexity: "small",
      sentiment: "positive",
      suggestedLabels: ["question", "docs"],
      needsMaintainer: false,
      confidence: 0.79,
      summary: "User-support question. Link to caching guide and offer suggested config snippet.",
    },
  },
];

export type DemoPR = {
  id: string;
  number: number;
  title: string;
  author: string;
  state: "open" | "merged" | "closed";
  additions: number;
  deletions: number;
  files: number;
  ai: {
    riskLevel: "low" | "medium" | "high";
    breaking: boolean;
    mergeReadiness: number;
    summary: string;
    changelogEntry: string;
    category: "Added" | "Changed" | "Fixed" | "Removed" | "Security" | "Deprecated";
  };
};

export const demoPRs: DemoPR[] = [
  {
    id: "p1",
    number: 902,
    title: "feat(client): generic-typed createClient<T>",
    author: "lin-ada",
    state: "open",
    additions: 184,
    deletions: 22,
    files: 9,
    ai: {
      riskLevel: "low",
      breaking: false,
      mergeReadiness: 86,
      summary:
        "Adds generic parameter to createClient with backward-compatible defaults. Updates types, docs, and one example.",
      changelogEntry: "Added generic type support to `createClient<T>` for improved inference.",
      category: "Added",
    },
  },
  {
    id: "p2",
    number: 899,
    title: "fix(stream): release buffers on disconnect",
    author: "marin-dev",
    state: "open",
    additions: 47,
    deletions: 19,
    files: 3,
    ai: {
      riskLevel: "medium",
      breaking: false,
      mergeReadiness: 72,
      summary:
        "Resolves the memory growth reported in #1284 by clearing per-connection buffers on socket close.",
      changelogEntry: "Fixed memory leak when streaming large payloads over websockets.",
      category: "Fixed",
    },
  },
  {
    id: "p3",
    number: 895,
    title: "refactor!: remove deprecated `legacyMode` flag",
    author: "core-team",
    state: "open",
    additions: 12,
    deletions: 318,
    files: 14,
    ai: {
      riskLevel: "high",
      breaking: true,
      mergeReadiness: 44,
      summary:
        "Removes the long-deprecated legacy compatibility flag. BREAKING. Requires major version bump.",
      changelogEntry: "Removed deprecated `legacyMode` flag — use the v3 config shape instead.",
      category: "Removed",
    },
  },
];

export type DemoContributor = {
  username: string;
  contributions: number;
  firstSeen: string;
  status: "core" | "returning" | "first-time";
  sentiment: "positive" | "neutral" | "negative";
};

export const demoContributors: DemoContributor[] = [
  {
    username: "lin-ada",
    contributions: 142,
    firstSeen: "2023-04",
    status: "core",
    sentiment: "positive",
  },
  {
    username: "marin-dev",
    contributions: 88,
    firstSeen: "2023-09",
    status: "core",
    sentiment: "neutral",
  },
  {
    username: "okafor-r",
    contributions: 41,
    firstSeen: "2024-02",
    status: "returning",
    sentiment: "positive",
  },
  {
    username: "sec-watcher",
    contributions: 6,
    firstSeen: "2024-08",
    status: "returning",
    sentiment: "neutral",
  },
  {
    username: "newbie-42",
    contributions: 1,
    firstSeen: "2025-04",
    status: "first-time",
    sentiment: "positive",
  },
  {
    username: "petra-k",
    contributions: 1,
    firstSeen: "2025-05",
    status: "first-time",
    sentiment: "positive",
  },
];

export type AILogEntry = {
  id: string;
  ts: string;
  repo: string;
  action: string;
  target: string;
  model: string;
  status: "drafted" | "approved" | "edited" | "rejected" | "published";
  user: string;
};

export const demoAILog: AILogEntry[] = [
  {
    id: "a1",
    ts: "2m ago",
    repo: "acme/atlas",
    action: "Issue triage",
    target: "#1284",
    model: "gemini-3-flash",
    status: "drafted",
    user: "you",
  },
  {
    id: "a2",
    ts: "14m ago",
    repo: "acme/atlas",
    action: "PR summary",
    target: "#902",
    model: "gemini-3-flash",
    status: "approved",
    user: "you",
  },
  {
    id: "a3",
    ts: "1h ago",
    repo: "acme/lumen",
    action: "Changelog draft",
    target: "v0.9.0",
    model: "gemini-3-flash",
    status: "edited",
    user: "you",
  },
  {
    id: "a4",
    ts: "3h ago",
    repo: "acme/prism-ui",
    action: "Docs suggestion",
    target: "README.md",
    model: "gemini-3-flash",
    status: "rejected",
    user: "you",
  },
  {
    id: "a5",
    ts: "yesterday",
    repo: "acme/atlas",
    action: "Issue triage",
    target: "#1271",
    model: "gemini-3-flash",
    status: "published",
    user: "you",
  },
];

export const healthBreakdown = {
  overall: 82,
  categories: [
    { key: "Issues", score: 78, hint: "5 stale issues over 60 days" },
    { key: "Pull requests", score: 84, hint: "Average review in 22h" },
    { key: "Documentation", score: 90, hint: "README, CONTRIBUTING, SECURITY present" },
    { key: "Security", score: 71, hint: "2 outdated dependencies (review recommended)" },
    { key: "Community", score: 86, hint: "Healthy first-time contributor onboarding" },
  ],
};

export const securityAlerts = [
  {
    id: "s1",
    severity: "high" as const,
    title: "Outdated dependency: `node-fetch@2.6.7`",
    detail: "Review recommended — a newer version is available with fixes.",
  },
  {
    id: "s2",
    severity: "medium" as const,
    title: "Missing SECURITY.md in `acme/prism-ui`",
    detail: "Add a security policy so reporters know how to disclose responsibly.",
  },
  {
    id: "s3",
    severity: "low" as const,
    title: "Potential secret pattern in issue #1166",
    detail: "Pattern resembles an API key. Review before responding publicly.",
  },
];

export const moderationQueue = [
  {
    id: "m1",
    kind: "spam" as const,
    issue: "#1290",
    snippet: "Visit my site for free crypto rewards…",
    confidence: 0.94,
  },
  {
    id: "m2",
    kind: "low-quality" as const,
    issue: "#1289",
    snippet: "doesnt work pls fix",
    confidence: 0.71,
  },
  {
    id: "m3",
    kind: "duplicate" as const,
    issue: "#1288",
    snippet: "Possible duplicate of #1284 (memory leak)",
    confidence: 0.68,
  },
];

export const roadmapClusters = [
  { key: "bugs", title: "Bugs", count: 14, hint: "Crash + perf reports" },
  { key: "quick-wins", title: "Quick wins", count: 9, hint: "Small, low-risk improvements" },
  {
    key: "requested",
    title: "Highly requested features",
    count: 6,
    hint: "Most-upvoted by community",
  },
  { key: "docs", title: "Documentation gaps", count: 7, hint: "Missing guides and examples" },
  { key: "security", title: "Security priorities", count: 3, hint: "Review recommended" },
  { key: "refactors", title: "Refactors", count: 5, hint: "Technical debt cleanup" },
];
