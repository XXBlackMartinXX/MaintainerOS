# AI Safety

MaintainerOS uses Lovable AI Gateway exclusively from server functions. No AI provider key is ever sent to the browser.

## Design principles

1. **Drafts only.** Every AI output is a draft until a maintainer approves or edits it.
2. **Validated output.** Every model response is parsed with a Zod schema. Failures surface in the UI as "AI output rejected — try again" rather than being silently shown.
3. **Bounded prompts.** Prompts only include the directly relevant context (one issue, one PR, one repo summary). They never include unrelated user data or other repositories.
4. **Respectful language.** Triage and contributor-related prompts instruct the model to use neutral, welcoming language.
5. **No automatic posting.** AI cannot take a public action. Publishing requires an explicit user confirmation.
6. **Clear labeling.** AI content is labeled "AI draft" everywhere it appears. In demo mode it is labeled "Demo AI output".
7. **Auditability.** Every AI call writes a row to the AI Action Log with model, action, confidence, and outcome.

## Failure modes handled

- Timeout → recorded as failure, user sees a retry button.
- Schema validation error → recorded, user sees "AI output rejected".
- Rate limit → recorded, user sees a friendly retry-later message.
- Missing API key → server returns a clear error; the UI tells the user AI Gateway is not configured.

## Not in scope (yet)

- Multi-step agent loops.
- Tool use that takes side effects on GitHub.
- Fine-tuning on user data.
