/**
 * Server-only Lovable AI Gateway provider. Never import from the browser.
 */
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const DEFAULT_TRIAGE_MODEL = "google/gemini-2.5-flash";

export class AIConfigError extends Error {}
export class AIRateLimitError extends Error {}
export class AICreditsError extends Error {}
export class AIResponseError extends Error {}

export function isAiConfigured(): boolean {
  return !!process.env.LOVABLE_API_KEY;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callAIJson(opts: {
  model?: string;
  messages: ChatMessage[];
  timeoutMs?: number;
  maxRetries?: number;
}): Promise<{ raw: string; model: string }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new AIConfigError("LOVABLE_API_KEY is not configured");
  const model = opts.model ?? DEFAULT_TRIAGE_MODEL;
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const maxRetries = opts.maxRetries ?? 2;

  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: opts.messages,
          response_format: { type: "json_object" },
        }),
      });
      if (res.status === 429) throw new AIRateLimitError("AI rate limit exceeded. Please retry shortly.");
      if (res.status === 402) throw new AICreditsError("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new AIResponseError(`AI gateway error ${res.status}: ${text.slice(0, 300)}`);
      }
      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const raw = json.choices?.[0]?.message?.content ?? "";
      if (!raw) throw new AIResponseError("Empty AI response");
      return { raw, model };
    } catch (err) {
      lastErr = err;
      // Don't retry config / credits / rate-limit
      if (err instanceof AIConfigError || err instanceof AICreditsError || err instanceof AIRateLimitError) {
        throw err;
      }
      if (attempt === maxRetries) break;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new AIResponseError("AI request failed");
}

export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  // Strip markdown fences if model returned them despite instruction
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(body);
  } catch {
    // Try first {...} block
    const m = body.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new AIResponseError("AI returned non-JSON content");
  }
}
