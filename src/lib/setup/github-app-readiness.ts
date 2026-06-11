/**
 * Pure helper that classifies GitHub App readiness from the booleans returned
 * by `getServerConfigStatus`. This is scaffold-only logic — nothing in the
 * runtime activates a GitHub App code path based on it.
 *
 * See docs/GITHUB_APP_MIGRATION_PLAN.md.
 */

export interface GithubAppReadinessInput {
  githubAppId: boolean;
  githubAppPrivateKey: boolean;
  githubAppClientId: boolean;
  githubAppClientSecret: boolean;
  githubAppWebhookSecret: boolean;
}

export type GithubAppReadiness =
  | { state: "not-configured"; reason: "no-env-vars-set" }
  | { state: "partial"; missing: string[] }
  | { state: "ready-for-scaffold"; missing: string[] };

const LABELS: Record<keyof GithubAppReadinessInput, string> = {
  githubAppId: "GITHUB_APP_ID",
  githubAppPrivateKey: "GITHUB_APP_PRIVATE_KEY",
  githubAppClientId: "GITHUB_APP_CLIENT_ID",
  githubAppClientSecret: "GITHUB_APP_CLIENT_SECRET",
  githubAppWebhookSecret: "GITHUB_APP_WEBHOOK_SECRET",
};

export function classifyGithubAppReadiness(
  input: GithubAppReadinessInput,
): GithubAppReadiness {
  const keys = Object.keys(LABELS) as (keyof GithubAppReadinessInput)[];
  const setCount = keys.filter((k) => input[k]).length;
  const missing = keys.filter((k) => !input[k]).map((k) => LABELS[k]);

  if (setCount === 0) {
    return { state: "not-configured", reason: "no-env-vars-set" };
  }
  // Minimum scaffold = id + private key. Anything else missing is a warning.
  if (input.githubAppId && input.githubAppPrivateKey) {
    return { state: "ready-for-scaffold", missing };
  }
  return { state: "partial", missing };
}
