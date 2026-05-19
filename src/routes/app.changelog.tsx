import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, DemoBadge, AIBadge } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { demoPRs } from "@/lib/demo-data";
import { Download, FileText, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/changelog")({
  component: ChangelogPage,
});

const CATEGORIES = ["Added", "Changed", "Fixed", "Deprecated", "Removed", "Security"] as const;

function ChangelogPage() {
  const [version, setVersion] = useState("0.9.0");
  const grouped = useMemo(() => {
    const g: Record<string, typeof demoPRs> = {};
    for (const c of CATEGORIES) g[c] = [];
    demoPRs.forEach((p) => g[p.ai.category].push(p));
    return g;
  }, []);

  const hasBreaking = demoPRs.some((p) => p.ai.breaking);
  const suggestedBump = hasBreaking ? "major" : grouped.Added.length ? "minor" : "patch";

  const markdown = useMemo(() => {
    let out = `# v${version}\n\n`;
    for (const c of CATEGORIES) {
      if (!grouped[c].length) continue;
      out += `## ${c}\n`;
      for (const p of grouped[c]) {
        out += `- ${p.ai.changelogEntry} (#${p.number})\n`;
      }
      out += `\n`;
    }
    return out;
  }, [grouped, version]);

  return (
    <div>
      <PageHeader
        title="Changelog Generator"
        description="Grouped from merged PRs. Suggested semver bump. Always editable before publishing."
        actions={<DemoBadge />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="panel rounded-xl p-4 flex flex-wrap items-center gap-3">
            <label className="text-xs text-muted-foreground">Version</label>
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm font-mono w-28"
            />
            <span className="inline-flex items-center gap-1.5 text-xs">
              <AIBadge />
              Suggested bump:
              <span className="font-mono text-foreground capitalize">{suggestedBump}</span>
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Download className="size-3.5" /> Export Markdown
              </Button>
              <Button size="sm">
                <Sparkles className="size-3.5" /> Prepare GitHub draft release
              </Button>
            </div>
          </div>

          {CATEGORIES.map((c) =>
            grouped[c].length ? (
              <div key={c} className="panel rounded-xl">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-medium">{c}</h3>
                  <span className="text-xs text-muted-foreground">{grouped[c].length}</span>
                </div>
                <ul>
                  {grouped[c].map((p) => (
                    <li
                      key={p.id}
                      className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0"
                    >
                      <FileText className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">{p.ai.changelogEntry}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          #{p.number} by {p.author}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-xs text-muted-foreground">
                        Edit
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </div>

        <div className="lg:col-span-2 panel rounded-xl p-4">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <FileText className="size-3.5" /> Preview
          </h3>
          <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap text-foreground/90 bg-surface rounded-md border border-border p-3 overflow-auto">
            {markdown}
          </pre>
        </div>
      </div>
    </div>
  );
}
