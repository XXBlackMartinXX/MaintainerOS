import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, DemoBadge } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/settings")({ component: SettingsPage });

function SettingsPage() {
  const [tone, setTone] = useState("friendly");
  const [sensitivity, setSensitivity] = useState("balanced");
  const [autoDraft, setAutoDraft] = useState(true);
  const [labels, setLabels] = useState("bug, enhancement, docs, good-first-issue");

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Tone, sensitivity, and defaults that shape every AI draft MaintainerOS generates."
        actions={<DemoBadge />}
      />
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
