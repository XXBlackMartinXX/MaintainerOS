import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, DemoBadge, AIBadge } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/app/docs")({ component: DocsPage });

const TEMPLATES: Record<string, string> = {
  "README.md": `# Project Name\n\nShort, honest description of what this project does and who it's for.\n\n## Install\n\n\`\`\`bash\nnpm install your-package\n\`\`\`\n\n## Quick start\n\n\`\`\`ts\nimport { createClient } from "your-package";\nconst client = createClient({ /* ... */ });\n\`\`\`\n\n## Contributing\n\nSee CONTRIBUTING.md.`,
  "CONTRIBUTING.md": `# Contributing\n\nThanks for considering a contribution!\n\n## Getting started\n1. Fork and clone the repo\n2. Install dependencies\n3. Run tests\n\n## Pull requests\n- Keep changes focused\n- Add tests when behavior changes\n- Update docs alongside code`,
  "CODE_OF_CONDUCT.md": `# Code of Conduct\n\nWe pledge to make participation in our community a harassment-free experience for everyone.`,
  "SECURITY.md": `# Security Policy\n\nPlease report vulnerabilities privately to security@example.com. Do not open public issues for security reports.`,
};

function DocsPage() {
  const [active, setActive] = useState("README.md");
  return (
    <div>
      <PageHeader
        title="Documentation Generator"
        description="AI-drafted templates and improvements for the docs every healthy project needs."
        actions={<DemoBadge />}
      />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="panel rounded-xl p-2">
          {Object.keys(TEMPLATES).map((k) => (
            <button
              key={k}
              onClick={() => setActive(k)}
              className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left ${
                active === k ? "bg-accent" : "hover:bg-accent/40 text-muted-foreground"
              }`}
            >
              <FileText className="size-3.5" /> {k}
            </button>
          ))}
        </div>
        <div className="lg:col-span-3 panel rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AIBadge />
              <h3 className="text-sm font-medium font-mono">{active}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline"><Download className="size-3.5" /> Export</Button>
              <Button size="sm">Open PR draft</Button>
            </div>
          </div>
          <textarea
            value={TEMPLATES[active]}
            readOnly
            className="w-full h-[480px] rounded-md border border-border bg-surface p-3 text-xs font-mono leading-relaxed text-foreground/90"
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            This is an AI-drafted template. Review and edit before opening a pull request.
          </p>
        </div>
      </div>
    </div>
  );
}
