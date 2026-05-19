# Production authentication setup

This guide walks you through configuring Supabase + GitHub OAuth for a
production deployment of MaintainerOS. After completing it, the
`/login` page will offer working "Continue with GitHub" sign-in.

Open `/setup` in your deployed app at any time to see a live checklist
of what's configured and what's still missing.

---

## Prerequisites

- A Supabase project (free tier is fine). If your hosting provider
  manages a Cloud backend for you, it likely already created one.
- A GitHub account that can create OAuth Apps.
- Permission to set environment variables in your hosting provider.

---

## Step 1 — Create or open your Supabase project

Go to https://supabase.com and either open the existing project or
create a new one. Note the **Project URL** and **Project ref** (the
subdomain in the Project URL, e.g. `abcd1234` from
`https://abcd1234.supabase.co`).

## Step 2 — Copy the Project URL

Set the following environment variable in your hosting provider:

```
VITE_SUPABASE_URL = https://<project-ref>.supabase.co
```

Also accepted as a fallback (server-side): `SUPABASE_URL`.

## Step 3 — Copy the anon / publishable key

In Supabase: **Project Settings → API → Project API keys → `anon` `public`**.

```
VITE_SUPABASE_ANON_KEY = <anon key>
```

Also accepted as fallbacks: `VITE_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`.

This key is safe to expose to the browser.

## Step 4 — Copy the service role key (server-only)

In Supabase: **Project Settings → API → Project API keys → `service_role`**.

```
SUPABASE_SERVICE_ROLE_KEY = <service role key>
```

**Never** expose this to the browser. Do not prefix it with `VITE_`.
It is required for admin writes such as storing GitHub tokens.

## Step 5 — Create a GitHub OAuth App

Go to https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**.

## Step 6 — Set the homepage URL

```
Homepage URL = <your deployed app URL>
```

For example: `https://maintaineros.example.com`.

## Step 7 — Set the authorization callback URL

This must point to **Supabase**, not your app:

```
Authorization callback URL = https://<project-ref>.supabase.co/auth/v1/callback
```

You can copy the exact value from `/setup` after Step 2 is done.

## Step 8 — Enable the GitHub provider in Supabase

In Supabase: **Authentication → Providers → GitHub** → toggle **Enabled**.

## Step 9 — Paste GitHub Client ID and Secret

From the GitHub OAuth App you created in Step 5, copy the **Client ID**
and generate a **Client Secret**, then paste both into the Supabase
GitHub provider form. Save.

You may also set the same values as backend secrets so `/setup` can
confirm they're configured:

```
GITHUB_CLIENT_ID = <client id>
GITHUB_CLIENT_SECRET = <client secret>
```

## Step 10 — Add Supabase redirect URLs

In Supabase: **Authentication → URL Configuration → Redirect URLs**.

Add both:

```
<your deployed app URL>
<your deployed app URL>/auth/callback
```

If you also test locally, add `http://localhost:3000` and
`http://localhost:3000/auth/callback`.

## Step 11 — (Optional) AI gateway key

For AI features (triage, PR summaries, changelog, docs):

```
LOVABLE_API_KEY = <managed AI gateway key>
```

## Step 12 — Redeploy and verify

Redeploy so the new environment variables are baked into the client
bundle, then visit:

1. `/setup` — every required row should be green.
2. `/login` — the "Continue with GitHub" button should be enabled.
3. Sign in. You should land in `/onboarding` or `/app`.

---

## Troubleshooting

- **"Backend setup required" on /login**: `VITE_SUPABASE_URL` and/or
  `VITE_SUPABASE_ANON_KEY` were missing at **build time**. Set them in
  your hosting provider and redeploy — runtime-only values won't work.
- **"Unsupported provider: provider is not enabled"**: Step 8 was
  skipped.
- **OAuth returns to `/login` with an error**: the callback URL in your
  GitHub OAuth App doesn't match Step 7, or the redirect URL list in
  Step 10 doesn't include `/auth/callback`.
- **Demo mode** at `/demo` always works, even with no Supabase
  configuration — useful for previewing the product without setup.
