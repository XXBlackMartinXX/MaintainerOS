import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Database, Sparkles, Github, CheckCircle2, AlertTriangle, History, Ban } from "lucide-react";
import { PageHeader } from "@/components/ui-bits";

export const Route = createFileRoute("/app/trust")({
  component: TrustPage,
  head: () => ({
    meta: [
      { title: "Trust Center — MaintainerOS" },
      { name: "description", content: "How MaintainerOS uses GitHub data, AI, and what requires your explicit approval." },
    ],
  }),
});

function Card({ icon: Icon, title, children }: { icon: typeof ShieldCheck; title: string; children: React.ReactNode }) {
  return (
    <div className="panel rounded-xl p-5">
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center ring-1 ring-primary/20">
          <Icon className="size-4" />
        </div>
        <h3 className="font-medium">{title}</h3>
      </div>
      <div className="mt-3 text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

function TrustPage() {
  return (
    <div>
      <PageHeader
        title="Trust Center"
        description="What MaintainerOS reads, stores, and writes — and what always requires your explicit approval."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card icon={Github} title="What we sync from GitHub">
          <p>Only data you have access to on repositories you connect:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Repository metadata (name, description, stars, language)</li>
            <li>Issues, pull requests, and labels</li>
            <li>Contributor logins and avatar URLs</li>
            <li>Release tags and timestamps</li>
          </ul>
          <p>We never sync private user emails, payment data, or repository secrets.</p>
        </Card>

        <Card icon={Database} title="What is stored in Lovable Cloud">
          <p>Synced GitHub data plus AI drafts and audit logs, scoped per repository and protected by row-level security.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Only members of a repository in MaintainerOS can read its data.</li>
            <li>AI drafts (issue triage, PR summaries, changelogs, docs) are stored with approval status and version history.</li>
            <li>Every publish event is recorded in <code className="font-mono">github_publish_events</code>.</li>
          </ul>
        </Card>

        <Card icon={Sparkles} title="How AI Gateway is used">
          <p>All AI calls run server-side through Lovable AI Gateway. No AI provider keys are exposed to the browser.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Prompts include only the relevant issue / PR / repo context.</li>
            <li>Outputs are validated with Zod schemas before being shown.</li>
            <li>Every call is logged with model, action, and outcome.</li>
          </ul>
        </Card>

        <Card icon={CheckCircle2} title="What requires explicit approval">
          <ul className="list-disc pl-5 space-y-1">
            <li>Posting an issue reply on GitHub</li>
            <li>Applying labels to an issue</li>
            <li>Posting a PR summary comment</li>
            <li>Creating a GitHub release draft</li>
          </ul>
          <p>Each requires an approved or edited AI draft, a click, a confirmation dialog, and a duplicate-protection check.</p>
        </Card>

        <Card icon={Ban} title="What is never automatic">
          <ul className="list-disc pl-5 space-y-1">
            <li>No automatic GitHub comments, labels, or releases.</li>
            <li>No background publishing.</li>
            <li>No automatic merging, closing, or reopening of issues or PRs.</li>
            <li>Releases are always created as <code className="font-mono">draft: true</code>.</li>
          </ul>
        </Card>

        <Card icon={History} title="Audit logging & duplicate protection">
          <p>Every AI action and GitHub publish action writes a row to the audit log with the source draft id, target GitHub object, and outcome.</p>
          <p>Before publishing, MaintainerOS checks for a prior successful publish of the same draft and blocks duplicates.</p>
        </Card>

        <Card icon={AlertTriangle} title="Demo data labeling">
          <p>Demo mode uses clearly fictional repository data, is labeled in the global banner and on every page, and never calls GitHub write functions.</p>
          <p>Demo data is never mixed with live synced data.</p>
        </Card>

        <Card icon={ShieldCheck} title="Current limitations">
          <ul className="list-disc pl-5 space-y-1">
            <li>MaintainerOS does not currently commit documentation to GitHub — you copy approved drafts manually.</li>
            <li>Security readiness signals are heuristics, not guarantees.</li>
            <li>Repository health scores are advisory and based on synced data only.</li>
          </ul>
        </Card>
      </div>

      <div className="mt-6 panel rounded-xl p-4 text-xs text-muted-foreground">
        Questions? See <Link to="/app/actions" className="text-primary underline">the AI Action Log</Link> for every recorded action, or open an issue on the project repository.
      </div>
    </div>
  );
}
