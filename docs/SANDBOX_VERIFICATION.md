# Sandbox Verification Checklist

> Owner-run only. **Do not** run this against production repos or accounts
> with sensitive data. Use a throwaway test repo. Do not paste tokens,
> session cookies, or environment values into screenshots or logs.

This checklist verifies the live-service integrations that CI cannot cover
without real credentials. Mark each item Pass / Fail / Skipped, capture
sanitised screenshots, and sign off at the bottom.

## 1. Pre-flight

- [ ] Sandbox GitHub repository created (non-sensitive).
- [ ] Supabase GitHub OAuth provider configured for the deployment.
- [ ] Deployed origin and `<origin>/auth/callback` added to Supabase
      Auth → Redirect URLs.
- [ ] `LOVABLE_API_KEY` present if AI features will be tested.
- [ ] `/setup` shows all required items as "configured".
- [ ] `/demo` still loads sample data with writes disabled.
- [ ] (Optional) GitHub private vulnerability reporting enabled on the
      sandbox repo.
- [ ] `bun run sandbox:preflight` reports no malformed local config.

## 2. OAuth and session

- [ ] Sign in with GitHub completes and returns to the app.
- [ ] Session is established (`/app` reachable).
- [ ] No token, key, or session cookie visible in the UI or console logs.
- [ ] Sign out clears the session.
- [ ] Re-sign-in works.

## 3. Repository sync

- [ ] Sandbox repo appears in the repo selector after connect.
- [ ] Issues, PRs, labels, and releases sync without error.
- [ ] Unrelated repos do not appear.
- [ ] Repo disconnect removes membership rows for the current user only.

## 4. AI draft generation

- [ ] Issue triage produces a draft tagged "AI draft".
- [ ] PR summary produces a draft tagged "AI draft".
- [ ] Changelog / release draft renders as a draft.
- [ ] Documentation draft renders as a draft.
- [ ] No AI output is auto-applied to GitHub.

## 5. Approval-gated publishing

- [ ] Test issue comment requires explicit approval before write.
- [ ] Test label apply requires explicit approval before write.
- [ ] Draft release creation requires approval and is created with
      `draft: true`.
- [ ] Re-publishing the same draft is blocked or warned (duplicate-publish
      check).

## 6. Audit log

- [ ] Every AI draft creation appears in `audit_logs`.
- [ ] Every publish event appears in `audit_logs` with type and timestamp.
- [ ] No token, secret, or raw provider payload appears in log rows.

## 7. Failure cases

- [ ] Missing AI key — UI shows a precise, non-secret error linking to
      `/setup`.
- [ ] Insufficient GitHub scope — UI shows a precise error explaining the
      missing scope.
- [ ] Invalid/expired token — sign-in is requested again; no stack trace.
- [ ] GitHub rate limit (429) — UI surfaces a retry message.
- [ ] Repo access lost — list refreshes and warns rather than crashing.

## 8. Evidence capture

- Screenshots of: `/setup`, repo list, AI draft labelled state, approval
  dialog, draft release on GitHub, audit log rows.
- Do **not** capture: bearer tokens, session cookies, env files, or
  provider response bodies.

## Sign-off

| Section            | Pass | Fail | Skipped | Notes |
| ------------------ | ---- | ---- | ------- | ----- |
| Pre-flight         |      |      |         |       |
| OAuth/session      |      |      |         |       |
| Repo sync          |      |      |         |       |
| AI drafts          |      |      |         |       |
| Publishing         |      |      |         |       |
| Audit log          |      |      |         |       |
| Failure cases      |      |      |         |       |

Reviewer: ______________________  Date: ____________
