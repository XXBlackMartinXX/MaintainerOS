/**
 * Sandbox preflight CLI — non-destructive local config classifier.
 *
 * - Never prints secret values.
 * - Never calls live GitHub, Supabase, or AI services.
 * - Exits non-zero only for malformed local config, not for intentionally
 *   missing optional live-service env vars.
 *
 * Usage: bun run sandbox:preflight
 */
import { classifyEnv, formatReport } from "../src/lib/reliability/sandbox-preflight";

const result = classifyEnv(process.env as Record<string, string | undefined>);
// eslint-disable-next-line no-console
console.log(formatReport(result));
process.exit(result.malformed.length > 0 ? 1 : 0);
