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
      </div>
      <div className="mt-6 flex justify-end">
        <Button>Save preferences</Button>
      </div>
    </div>
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
