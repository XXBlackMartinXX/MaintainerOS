/**
 * Sandbox preflight — non-destructive local config classifier.
 *
 * - Never prints secret values.
 * - Never calls live GitHub, Supabase, or AI services.
 * - Exits non-zero only for malformed local config, not for intentionally
 *   missing optional live-service env vars.
 *
 * Usage: bun run sandbox:preflight
 */

type Status = "configured" | "missing" | "malformed";

interface CheckRow {
  name: string;
  status: Status;
  required: boolean;
  note?: string;
}

const REQUIRED_CLIENT = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"] as const;
const REQUIRED_SERVER = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;
const OPTIONAL_SERVER = [
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_WEBHOOK_SECRET",
  "LOVABLE_API_KEY",
] as const;

export interface PreflightResult {
  rows: CheckRow[];
  malformed: string[];
  canTrySupabase: boolean;
  canTryAi: boolean;
  canTryGithubOauth: boolean;
}

export function classifyEnv(env: Record<string, string | undefined>): PreflightResult {
  const rows: CheckRow[] = [];
  const malformed: string[] = [];

  const classify = (name: string, required: boolean): CheckRow => {
    const raw = env[name];
    if (raw === undefined || raw === "") {
      return { name, status: "missing", required };
    }
    // Malformed checks (cheap, non-secret): URLs should parse.
    if (name.endsWith("_URL")) {
      try {
        new URL(raw);
      } catch {
        malformed.push(name);
        return { name, status: "malformed", required, note: "not a valid URL" };
      }
    }
    return { name, status: "configured", required };
  };

  for (const n of REQUIRED_CLIENT) rows.push(classify(n, true));
  for (const n of REQUIRED_SERVER) rows.push(classify(n, true));
  for (const n of OPTIONAL_SERVER) rows.push(classify(n, false));

  const has = (n: string) => rows.find((r) => r.name === n)?.status === "configured";

  return {
    rows,
    malformed,
    canTrySupabase: has("SUPABASE_URL") && has("SUPABASE_PUBLISHABLE_KEY"),
    canTryAi: has("LOVABLE_API_KEY"),
    canTryGithubOauth: has("GITHUB_CLIENT_ID") && has("GITHUB_CLIENT_SECRET"),
  };
}

export function formatReport(result: PreflightResult): string {
  const lines: string[] = [];
  lines.push("Sandbox preflight — local config only. No live calls made.");
  lines.push("");
  for (const r of result.rows) {
    const tag = r.required ? "required" : "optional";
    lines.push(`  [${r.status.padEnd(10)}] ${r.name.padEnd(34)} (${tag})${r.note ? " — " + r.note : ""}`);
  }
  lines.push("");
  lines.push(`  Supabase sandbox attempt: ${result.canTrySupabase ? "possible" : "not configured"}`);
  lines.push(`  GitHub OAuth attempt:     ${result.canTryGithubOauth ? "possible" : "not configured"}`);
  lines.push(`  AI gateway attempt:       ${result.canTryAi ? "possible" : "not configured"}`);
  if (result.malformed.length) {
    lines.push("");
    lines.push(`  Malformed (must fix): ${result.malformed.join(", ")}`);
  }
  return lines.join("\n");
}

// CLI entry: only run when invoked directly.
const isCli = typeof process !== "undefined" && process.argv[1]?.endsWith("sandbox-preflight.ts");
if (isCli) {
  const result = classifyEnv(process.env as Record<string, string | undefined>);
  // eslint-disable-next-line no-console
  console.log(formatReport(result));
  process.exit(result.malformed.length > 0 ? 1 : 0);
}
