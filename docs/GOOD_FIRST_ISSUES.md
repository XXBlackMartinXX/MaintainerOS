# Good first issues

A curated list of honest, beginner-friendly issues to open on GitHub after
the initial public preview is published. Copy each block into a new issue
and adjust as needed.

Labels suggested: `good first issue`, `help wanted`, `documentation`,
`enhancement`.

---

## 1. Add real screenshots to README

**Difficulty:** good first issue

**Description:** The README currently links to `docs/screenshots/README.md`
with a TODO list of screenshots that have not been captured yet.

**Why it matters:** Reviewers and potential contributors form their first
impression from screenshots. Empty placeholders make the project look
unfinished.

**Suggested implementation:**
- Run the app in demo mode (`/demo` → `/app`).
- Capture each screen listed in `docs/screenshots/README.md` at
  ~1600×1000.
- Save under `docs/screenshots/` and reference them from the README
  Screenshots section.

---

## 2. Improve onboarding copy on `/setup`

**Difficulty:** good first issue

**Description:** The `/setup` diagnostics page works but the copy is
terse and assumes the reader already knows what Supabase env vars are.

**Why it matters:** Setup is the very first thing a self-hoster does.
Clearer copy reduces drop-off.

**Suggested implementation:** Rewrite each checklist item with a one-line
explanation of what the variable does and where to find it. Keep the
diagnostic logic untouched.

---

## 3. Add more demo repositories to demo mode

**Difficulty:** good first issue

**Description:** Demo mode in `src/lib/demo-data.ts` ships with a single
synthetic repository. Adding 2–3 more (a small library, a docs site, a
larger app) would show the product across different repo shapes.

**Why it matters:** A single demo repo makes the product feel narrow.

**Suggested implementation:** Extend `demo-data.ts` with additional
repos and matching issues / PRs / contributors. Keep the data clearly
synthetic (no real GitHub handles).

---

## 4. Improve Supabase setup docs

**Difficulty:** good first issue

**Description:** `docs/PRODUCTION_AUTH_SETUP.md` covers the steps but
could use screenshots of each Supabase dashboard screen and a
troubleshooting FAQ.

**Why it matters:** Auth setup is the most common place self-hosters get
stuck.

**Suggested implementation:** Add screenshots, a "common errors" section,
and a checklist of redirect URLs to add.

---

## 5. Add smoke tests for critical routes

**Difficulty:** help wanted

**Description:** The project has no automated test suite. A small set of
smoke tests covering `/`, `/demo`, `/app`, `/login`, `/setup` would catch
regressions like the recent route crashes.

**Why it matters:** Pre-1.0 we rely on manual checks. Even basic smoke
tests would catch most production-blocking issues.

**Suggested implementation:** Add Vitest + a lightweight render test or
Playwright with a single happy-path script per route.

---

## 6. Improve mobile layout for the dashboard

**Difficulty:** good first issue

**Description:** The dashboard sidebar and triage panel are designed
desktop-first. On narrow viewports (≤640px) several panels overflow.

**Why it matters:** Many maintainers triage issues from a phone.

**Suggested implementation:** Audit `src/routes/app.*.tsx` at 375px and
adjust Tailwind responsive classes. No business-logic changes.

---

## 7. Add a self-hosting guide

**Difficulty:** help wanted

**Description:** `docs/LOCAL_DEVELOPMENT.md` covers running locally but
there is no end-to-end guide for deploying to Cloudflare Workers, Vercel,
or Fly.

**Why it matters:** Self-hosting is a core promise of the project.

**Suggested implementation:** Create `docs/SELF_HOSTING.md` with one
section per supported platform, including env-var configuration.

---

## 8. Improve accessibility labels

**Difficulty:** good first issue

**Description:** Some icon-only buttons in the sidebar and top nav are
missing `aria-label` attributes.

**Why it matters:** Screen-reader users cannot navigate icon-only
controls without labels.

**Suggested implementation:** Sweep `src/components/app-sidebar.tsx`,
`top-nav.tsx`, and any icon-only `<Button>` in route files. Add
`aria-label` to each.

---

## 9. Add an example security policy template

**Difficulty:** good first issue

**Description:** The documentation generator should include a richer
SECURITY.md template with disclosure timelines and safe-harbor language.

**Why it matters:** Many small repos copy whatever template they see
first. A good default raises the floor.

**Suggested implementation:** Extend the SECURITY prompt in
`src/lib/ai/prompts/docs-generator.ts` and update the corresponding
sample.

---

## 10. Improve changelog generator examples

**Difficulty:** good first issue

**Description:** The changelog generator produces good Keep-a-Changelog
output but the in-app example is sparse.

**Why it matters:** The generated draft is only as good as the prompt's
exemplars.

**Suggested implementation:** Add 2–3 worked examples to the prompt in
`src/lib/ai/prompts/changelog.ts` covering bugfix-only, feature-heavy,
and breaking-change releases.

---

## 11. Add a `CODEOWNERS` template to the docs generator

**Difficulty:** good first issue

**Description:** The docs generator covers README, CONTRIBUTING,
SECURITY, etc., but not `CODEOWNERS`. Many repos benefit from a
starter file.

**Why it matters:** CODEOWNERS is a high-leverage maintainer file that
most small projects skip because writing one feels daunting.

**Suggested implementation:** Add a new prompt + UI entry mirroring the
existing docs generator entries.

---

## 12. Surface clearer empty states on the dashboard

**Difficulty:** good first issue

**Description:** Some empty states in `src/components/empty-states.tsx`
just say "No data". They could explain why and what to do next.

**Why it matters:** Empty states are onboarding moments.

**Suggested implementation:** For each empty state, add a one-sentence
explanation and a link to the relevant action (Sync, Connect Repo,
Enable Demo Mode).
