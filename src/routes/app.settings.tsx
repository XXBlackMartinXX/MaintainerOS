import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Github, ShieldCheck, ShieldAlert, Loader2, Sparkles, PlayCircle, AlertTriangle } from "lucide-react";
import { PageHeader, DemoBadge } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { getGithubWritePermissions } from "@/lib/github-publish.functions";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { useProductTour } from "@/hooks/use-product-tour";

export const Route = createFileRoute("/app/settings")({ component: SettingsPage });

function SettingsPage() {
  const [tone, setTone] = useState("friendly");
  const [sensitivity, setSensitivity] = useState("balanced");
  const [autoDraft, setAutoDraft] = useState(true);
  const [writesEnabled, setWritesEnabled] = useState(true);
  const [labels, setLabels] = useState("bug, enhancement, docs, good-first-issue");
  const { enabled: demo, setDemo } = useDemoMode();
  const { restart: restartTour } = useProductTour();
  const permsFn = useServerFn(getGithubWritePermissions);
  const permsQ = useQuery({ queryKey: ["github-perms"], queryFn: () => permsFn(), enabled: !demo });
  const perms = permsQ.data;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Tone, sensitivity, and defaults that shape every AI draft MaintainerOS generates."
        actions={<DemoBadge />}
      />

      <div className="panel rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Github className="size-4" /> GitHub permissions
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              MaintainerOS only writes to GitHub after you explicitly approve and confirm an action.
            </p>
            {perms?.githubLogin && (
              <p className="text-xs mt-2">Connected as <span className="font-mono">{perms.githubLogin}</span></p>
            )}
          </div>
          {permsQ.isLoading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <Link to="/login" className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-accent">
              <Github className="size-3" /> Reconnect GitHub
            </Link>
          )}
        </div>
        {perms && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <PermRow label="Read repository data" ok={perms.hasToken} />
            <PermRow label="Post issue comments" ok={perms.canCommentIssues} />
            <PermRow label="Apply issue labels" ok={perms.canManageLabels} />
            <PermRow label="Post PR comments" ok={perms.canCommentPulls} />
            <PermRow label="Create release drafts" ok={perms.canCreateReleases} />
          </div>
        )}
        {perms && perms.scopes.length > 0 && (
          <div className="mt-3 text-[11px] text-muted-foreground">
            Scopes: <span className="font-mono">{perms.scopes.join(" ")}</span>
          </div>
        )}
        {perms && !perms.canCommentIssues && (
          <p className="mt-3 text-xs text-warning">
            Your current GitHub session is missing the <code className="font-mono">repo</code> scope. Reconnect to enable publish actions.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="AI tone" desc="How AI-drafted replies should sound.">
          <Radios value={tone} onChange={setTone} options={["concise", "friendly", "formal"]} />
        </Section>

        <Section title="Security sensitivity" desc="Threshold for surfacing potential security issues.">
          <Radios value={sensitivity} onChange={setSensitivity} options={["relaxed", "balanced", "strict"]} />
        </Section>

        <Section title="Auto-draft release notes" desc="Generate a draft when PRs are merged.">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoDraft}
              onChange={(e) => setAutoDraft(e.target.checked)}
              className="size-4 accent-primary"
            />
            Generate drafts automatically
          </label>
        </Section>

        <Section title="Default labels" desc="Comma-separated. Suggested by AI when triaging." span={3}>
          <input
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono"
          />
        </Section>

        <Section title="Enable GitHub write actions" desc="When off, all publish buttons across the app are disabled." span={3}>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={writesEnabled}
              onChange={(e) => setWritesEnabled(e.target.checked)}
              className="size-4 accent-primary"
            />
            Allow publishing approved drafts to GitHub
          </label>
        </Section>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel rounded-xl p-5">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> Demo mode
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Browse MaintainerOS with illustrative sample data. Publishing and sync are disabled while active.
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={demo}
              onChange={(e) => setDemo(e.target.checked)}
              className="size-4 accent-primary"
            />
            Use demo mode
          </label>
        </div>

        <div className="panel rounded-xl p-5">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <PlayCircle className="size-4 text-primary" /> Product tour
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Replay the quick walkthrough of MaintainerOS's main areas.
          </p>
          <Button size="sm" variant="outline" className="mt-3" onClick={restartTour}>
            Restart tour
          </Button>
        </div>
      </div>

      <div className="mt-6 panel rounded-xl border-destructive/30 p-5">
        <h3 className="text-sm font-medium flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-4" /> Danger zone
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Destructive actions. All currently disabled until implemented.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <DangerButton label="Disconnect repository" />
          <DangerButton label="Delete local synced data" />
          <DangerButton label="Delete account" />
        </div>
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        Audit logs and GitHub publish events are retained for the lifetime of the project. There is currently no automatic retention rollover.
      </p>

      <div className="mt-6 flex justify-end">
        <Button>Save preferences</Button>
      </div>
    </div>
  );
}

function DangerButton({ label }: { label: string }) {
  return (
    <button
      disabled
      title="Coming soon"
      className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-left text-destructive/70 cursor-not-allowed"
    >
      <div className="font-medium">{label}</div>
      <div className="text-[10px] uppercase tracking-wider mt-0.5 opacity-70">Coming soon</div>
    </button>
  );
}

function PermRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-md border px-2 py-1.5 ${ok ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}>
      {ok ? <ShieldCheck className="size-3.5 text-success" /> : <ShieldAlert className="size-3.5 text-warning" />}
      <span>{label}</span>
      <span className={`ml-auto text-[10px] uppercase tracking-wider ${ok ? "text-success" : "text-warning"}`}>{ok ? "granted" : "missing"}</span>
    </div>
  );
}


function Section({
  title,
  desc,
  children,
  span = 1,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
  span?: number;
}) {
  return (
    <div className={`panel rounded-xl p-5 ${span === 3 ? "lg:col-span-3" : ""}`}>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Radios({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-3 py-1.5 text-xs rounded capitalize transition-colors ${
            value === o ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
