import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Sparkles, ExternalLink, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clientEnv, clientFeatures } from "@/lib/env";
import { getServerConfigStatus, type ServerConfigStatus } from "@/lib/setup.functions";
import { toast } from "sonner";

function CopyField({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success(`${label ?? "Value"} copied`);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Copy failed");
        }
      }}
      className="inline-flex w-full items-center gap-2 rounded bg-muted px-2 py-1 text-left text-xs hover:bg-muted/70"
      aria-label={`Copy ${label ?? "value"}`}
    >
      <code className="flex-1 truncate">{value}</code>
      {copied ? <Check className="size-3 flex-none text-success" /> : <Copy className="size-3 flex-none text-muted-foreground" />}
    </button>
  );
}

export const Route = createFileRoute("/setup")({
  component: SetupPage,
  head: () => ({
    meta: [
      { title: "Setup diagnostics — MaintainerOS" },
      {
        name: "description",
        content:
          "Verify Supabase, GitHub OAuth, and AI gateway configuration for a MaintainerOS deployment.",
      },
    ],
  }),
});

type Row = {
  label: string;
  ok: boolean;
  name: string;
  hint?: string;
  required?: boolean;
};

function StatusRow({ row }: { row: Row }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border/60 bg-card/40 p-3">
      {row.ok ? (
        <CheckCircle2 className="size-5 flex-none text-success" aria-hidden />
      ) : (
        <XCircle
          className={`size-5 flex-none ${row.required ? "text-destructive" : "text-muted-foreground"}`}
          aria-hidden
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{row.label}</span>
          <code className="text-xs rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
            {row.name}
          </code>
          <span
            className={`text-xs ${row.ok ? "text-success" : row.required ? "text-destructive" : "text-muted-foreground"}`}
          >
            {row.ok ? "configured" : row.required ? "missing (required)" : "missing (optional)"}
          </span>
        </div>
        {row.hint && !row.ok && (
          <p className="mt-1 text-xs text-muted-foreground">{row.hint}</p>
        )}
      </div>
    </div>
  );
}

function SetupPage() {
  const [server, setServer] = useState<ServerConfigStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getServerConfigStatus({})
      .then(setServer)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to read server config"));
  }, []);

  const appOrigin = typeof window !== "undefined" ? window.location.origin : "";

  // Derive project ref from either the server config OR the client-visible
  // VITE_SUPABASE_URL — whichever resolves first.
  let derivedRef: string | null = server?.supabaseProjectRef ?? null;
  if (!derivedRef && clientEnv.supabaseUrl) {
    try {
      derivedRef = new URL(clientEnv.supabaseUrl).host.split(".")[0] || null;
    } catch {
      derivedRef = null;
    }
  }
  const projectRef = derivedRef;
  const expectedCallback = projectRef
    ? `https://${projectRef}.supabase.co/auth/v1/callback`
    : "https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback";

  const clientRows: Row[] = [
    {
      label: "Supabase URL (client)",
      name: "VITE_SUPABASE_URL",
      ok: Boolean(clientEnv.supabaseUrl),
      required: true,
      hint: "Set this in your hosting environment and redeploy.",
    },
    {
      label: "Supabase anon / publishable key (client)",
      name: "VITE_SUPABASE_ANON_KEY",
      ok: Boolean(clientEnv.supabasePublishableKey),
      required: true,
      hint: "Use the public anon/publishable key — never the service role key.",
    },
  ];

  const serverRows: Row[] = server
    ? [
        {
          label: "Supabase URL (server)",
          name: "SUPABASE_URL",
          ok: server.supabaseUrl,
          required: true,
        },
        {
          label: "Supabase publishable key (server)",
          name: "SUPABASE_PUBLISHABLE_KEY",
          ok: server.supabasePublishableKey,
          required: true,
        },
        {
          label: "Supabase service role key (server only)",
          name: "SUPABASE_SERVICE_ROLE_KEY",
          ok: server.supabaseServiceRoleKey,
          required: true,
          hint: "Never exposed to the browser. Required for admin writes (token storage, sync).",
        },
        {
          label: "GitHub OAuth client ID",
          name: "GITHUB_CLIENT_ID",
          ok: server.githubClientId,
          hint: "Required for GitHub sign-in. Configure the provider in Supabase Auth → Providers → GitHub.",
        },
        {
          label: "GitHub OAuth client secret",
          name: "GITHUB_CLIENT_SECRET",
          ok: server.githubClientSecret,
          hint: "Pair with the client ID. Stored server-side only.",
        },
        {
          label: "GitHub webhook secret",
          name: "GITHUB_WEBHOOK_SECRET",
          ok: server.githubWebhookSecret,
          hint: "Optional. Required only if you wire up a GitHub webhook receiver.",
        },
        {
          label: "Managed AI gateway key",
          name: "LOVABLE_API_KEY",
          ok: server.lovableApiKey,
          hint: "Required for AI features (triage, PR summaries, changelog, docs).",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background grid-bg">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-center gap-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="size-7 rounded-md bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/30">
              <Sparkles className="size-4" />
            </div>
            <span className="font-semibold tracking-tight">MaintainerOS</span>
          </Link>
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Setup diagnostics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify your deployment configuration. Values are never displayed — only whether each
          variable is set.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/">Back to home</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/login">Go to login</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/demo">Try the demo</Link>
          </Button>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Browser (public) variables
          </h2>
          <div className="mt-3 space-y-2">
            {clientRows.map((r) => (
              <StatusRow key={r.name} row={r} />
            ))}
          </div>
          {!clientFeatures.hasSupabase && (
            <p className="mt-2 text-xs text-warning">
              Live auth is disabled in the browser until both <code>VITE_SUPABASE_URL</code> and{" "}
              <code>VITE_SUPABASE_ANON_KEY</code> are set at build time.
            </p>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Server (private) variables
          </h2>
          {error && (
            <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          {!server && !error && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Reading server configuration…
            </p>
          )}
          {server && (
            <div className="mt-3 space-y-2">
              {serverRows.map((r) => (
                <StatusRow key={r.name} row={r} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-lg border border-border/60 bg-card/40 p-4">
          <h2 className="text-sm font-semibold">GitHub OAuth callback</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure these in <strong>Supabase Auth → Providers → GitHub</strong> and in your{" "}
            <a
              className="underline inline-flex items-center gap-1"
              href="https://github.com/settings/developers"
              target="_blank"
              rel="noreferrer"
            >
              GitHub OAuth App <ExternalLink className="size-3" />
            </a>
            .
          </p>
          <dl className="mt-3 grid gap-2 text-xs">
            <div>
              <dt className="text-muted-foreground">GitHub OAuth App callback URL</dt>
              <dd>
                <code className="rounded bg-muted px-1.5 py-0.5">{expectedCallback}</code>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Supabase Auth redirect URLs (add both)</dt>
              <dd className="space-y-1">
                <div>
                  <code className="rounded bg-muted px-1.5 py-0.5">
                    {appOrigin || "https://your-app-domain"}
                  </code>
                </div>
                <div>
                  <code className="rounded bg-muted px-1.5 py-0.5">
                    {appOrigin || "https://your-app-domain"}/auth/callback
                  </code>
                </div>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Recommended GitHub scopes</dt>
              <dd>
                <code className="rounded bg-muted px-1.5 py-0.5">
                  read:user user:email repo read:org
                </code>
              </dd>
            </div>
          </dl>
          {!projectRef && (
            <p className="mt-2 text-xs text-muted-foreground">
              The exact callback URL is shown in Supabase Auth → Providers → GitHub. Copy it from
              there if your project ref cannot be inferred above.
            </p>
          )}
        </section>

        <section className="mt-8 rounded-lg border border-border/60 bg-card/40 p-4">
          <h2 className="text-sm font-semibold">Demo mode</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Demo mode works without any Supabase configuration. Visit{" "}
            <Link to="/demo" className="underline">
              /demo
            </Link>{" "}
            to load sample data with all write actions disabled.
          </p>
        </section>
      </div>
    </div>
  );
}
