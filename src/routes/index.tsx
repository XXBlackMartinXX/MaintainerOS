import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Github,
  Sparkles,
  Inbox,
  GitPullRequest,
  FileText,
  Users,
  ShieldCheck,
  Activity,
  Check,
  Lock,
  Eye,
  PlayCircle,
  Map,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { enableDemoMode } from "@/hooks/use-demo-mode";
import { PROJECT_META } from "@/lib/project-meta";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "MaintainerOS — AI operations center for open-source maintainers" },
      {
        name: "description",
        content:
          "Run your open-source project like a world-class engineering team. AI-powered issue triage, PR summaries, changelogs, and repo health — drafts only, you stay in control.",
      },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <SocialNote />
      <HowItWorks />
      <Features />
      <UseCases />
      <ApprovalFirst />
      <DemoSection />
      <Privacy />
      <Roadmap />
      <Pricing />
      <CTASection />
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="max-w-6xl mx-auto h-14 px-4 md:px-6 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/30">
            <Sparkles className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">MaintainerOS</span>
          <span className="ml-1 text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1 py-0.5">
            Open source
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#use-cases" className="hover:text-foreground">
            Use cases
          </a>
          <a href="#privacy" className="hover:text-foreground">
            Privacy
          </a>
          <a href="#pricing" className="hover:text-foreground">
            Pricing
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <Github className="size-4" /> Star on GitHub
            </a>
          </Button>
          <Button asChild size="sm">
            <Link to="/app">
              Open dashboard <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const navigate = useNavigate();
  const tryDemo = () => {
    enableDemoMode();
    navigate({ to: "/app" });
  };
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <div className="absolute inset-0 -z-10 grid-bg opacity-50" />
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" />
          MIT-licensed · Self-hostable · Privacy-first
        </div>
        <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-gradient max-w-4xl mx-auto leading-[1.05]">
          Run your open-source project like a world-class engineering team.
        </h1>
        <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          MaintainerOS gives maintainers AI-powered issue triage, PR summaries, changelogs,
          contributor insights, and repo health analytics in one focused dashboard.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="shadow-[var(--shadow-glow)]">
            <Link to="/login">
              <Github className="size-4" /> Connect GitHub
            </Link>
          </Button>
          <Button size="lg" variant="outline" onClick={tryDemo}>
            <PlayCircle className="size-4" /> Try demo
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Demo mode uses clearly-labeled sample data and never calls GitHub or AI providers.
        </p>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="mt-16 mx-auto max-w-5xl">
      <div className="relative rounded-2xl border border-border bg-surface/60 backdrop-blur p-2 shadow-[var(--shadow-panel)]">
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="h-9 border-b border-border flex items-center gap-1.5 px-3">
            <span className="size-2.5 rounded-full bg-destructive/60" />
            <span className="size-2.5 rounded-full bg-warning/60" />
            <span className="size-2.5 rounded-full bg-success/60" />
            <span className="ml-3 text-xs text-muted-foreground font-mono">
              maintainer-os / acme/atlas
            </span>
          </div>
          <div className="grid grid-cols-12 gap-0">
            <div className="col-span-3 border-r border-border p-3 hidden sm:block">
              {[
                "Dashboard",
                "Issue Triage",
                "Pull Requests",
                "Changelog",
                "Contributors",
                "Security",
              ].map((l, i) => (
                <div
                  key={l}
                  className={`text-xs rounded px-2 py-1.5 mb-0.5 ${
                    i === 1 ? "bg-accent text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {l}
                </div>
              ))}
            </div>
            <div className="col-span-12 sm:col-span-9 p-4 space-y-3">
              <div className="text-xs text-muted-foreground">AI triage queue · 5 issues</div>
              {[
                { n: 1284, t: "Memory leak when streaming large payloads", s: "high", p: "P1" },
                { n: 1271, t: "Add TypeScript generics to createClient<T>", s: "low", p: "P2" },
                {
                  n: 1269,
                  t: "Possible prototype pollution in config merge",
                  s: "critical",
                  p: "P0",
                },
              ].map((row) => (
                <div
                  key={row.t}
                  className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 text-xs"
                >
                  <span className="font-mono text-muted-foreground">#{row.n}</span>
                  <span className="flex-1 truncate text-foreground">{row.t}</span>
                  <span className="rounded border border-border-strong px-1.5 py-0.5 font-mono text-muted-foreground">
                    {row.p}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 capitalize ${
                      row.s === "critical"
                        ? "bg-destructive/15 text-destructive"
                        : row.s === "high"
                          ? "bg-warning/15 text-warning"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {row.s}
                  </span>
                  <span className="rounded border border-info/30 bg-info/10 text-info px-1.5 py-0.5">
                    AI draft
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialNote() {
  return (
    <section className="py-10 border-y border-border/60 bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Built for maintainers · Compatible with any GitHub repository
        </p>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: Inbox,
      title: "AI issue triage",
      desc: "Drafts type, severity, priority, labels, and a suggested reply. You review before anything is posted.",
    },
    {
      icon: GitPullRequest,
      title: "PR summaries",
      desc: "Plain-English summary, risk level, breaking-change detection, and a ready-to-edit changelog entry.",
    },
    {
      icon: FileText,
      title: "Changelog generator",
      desc: "Group merged PRs into Added / Changed / Fixed and propose a semver bump. Always editable.",
    },
    {
      icon: Activity,
      title: "Repo health score",
      desc: "0–100 score across issues, PRs, docs, security and community, with concrete next actions.",
    },
    {
      icon: Users,
      title: "Contributor insights",
      desc: "Top, returning, and first-time contributors. Privacy-respecting — no hostile scoring.",
    },
    {
      icon: ShieldCheck,
      title: "Security & moderation",
      desc: "Surfaces potential risks, spam, and low-quality issues as suggestions for maintainer review.",
    },
  ];
  return (
    <section id="features" className="py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <SectionEyebrow>Features</SectionEyebrow>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">
          An operations center, not another notification firehose.
        </h2>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Every AI output is a draft. You stay the maintainer; MaintainerOS does the prep work.
        </p>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="panel rounded-xl p-5 hover:border-border-strong transition-colors"
            >
              <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center ring-1 ring-primary/20">
                <Icon className="size-4" />
              </div>
              <h3 className="mt-4 font-medium">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  const cases = [
    {
      title: "Solo maintainers",
      desc: "Cut triage from hours to minutes. Auto-drafted replies and labels you can accept with one click.",
    },
    {
      title: "Small core teams",
      desc: "Shared health dashboard, AI-suggested roadmap clusters, audit log of every AI action.",
    },
    {
      title: "Foundation projects",
      desc: "Self-host on your own infrastructure, bring your own AI provider, full transparency for the community.",
    },
  ];
  return (
    <section id="use-cases" className="py-24 border-t border-border/60">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <SectionEyebrow>Who it's for</SectionEyebrow>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {cases.map((c) => (
            <div key={c.title} className="panel rounded-xl p-6">
              <h3 className="font-medium">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Privacy() {
  const items = [
    "Drafts only — nothing is posted to GitHub without your approval",
    "No hostile contributor ranking; community health, not surveillance",
    "Every AI action is logged with model, prompt category, and outcome",
    "Bring your own AI provider, or self-host the entire stack",
    "MIT licensed source code, open issue tracker",
  ];
  return (
    <section id="privacy" className="py-24 border-t border-border/60">
      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <SectionEyebrow>
            <Lock className="size-3" /> Privacy & ethics
          </SectionEyebrow>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
            Transparent AI. Maintainer in control.
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            MaintainerOS is designed to respect contributors and the open-source community. It never
            invents activity, never auto-enforces, and never claims to know things it can't measure.
          </p>
        </div>
        <ul className="space-y-3">
          {items.map((t) => (
            <li key={t} className="flex items-start gap-3 panel rounded-lg p-3.5">
              <Check className="size-4 mt-0.5 text-primary shrink-0" />
              <span className="text-sm text-foreground">{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      name: "Self-hosted",
      price: "Free",
      note: "MIT license",
      features: ["Unlimited repos", "Bring your own AI key", "Full source access"],
    },
    {
      name: "Cloud — Solo",
      price: "$0",
      note: "Coming soon",
      features: ["1 maintainer", "Up to 3 repos", "Lovable AI Gateway included"],
    },
    {
      name: "Cloud — Team",
      price: "TBD",
      note: "Coming soon",
      features: ["Multiple maintainers", "Unlimited repos", "Priority support"],
    },
  ];
  return (
    <section id="pricing" className="py-24 border-t border-border/60">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <SectionEyebrow>Pricing</SectionEyebrow>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
          Free and open. Hosted plans are a placeholder.
        </h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((t, i) => (
            <div
              key={t.name}
              className={`panel rounded-xl p-6 ${i === 0 ? "ring-1 ring-primary/40" : ""}`}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-medium">{t.name}</h3>
                <span className="text-xs text-muted-foreground">{t.note}</span>
              </div>
              <div className="mt-4 text-3xl font-semibold tracking-tight">{t.price}</div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 border-t border-border/60">
      <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Spend less time on triage. More time on the project you love.
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/app">
              <Github className="size-4" /> Open the demo
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <Eye className="size-4" /> View source
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row gap-4 md:items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/30">
            <Sparkles className="size-3" />
          </div>
          <span className="font-medium text-foreground">MaintainerOS</span>
          <span>· MIT licensed</span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            GitHub repository
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            Docs
          </a>
          <Link to="/app/trust" className="hover:text-foreground">
            Trust Center
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            Security
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            Code of Conduct
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            License (MIT)
          </a>
          <Link to="/app" className="hover:text-foreground">
            Dashboard
          </Link>
        </nav>
      </div>
      <p className="max-w-6xl mx-auto px-4 md:px-6 mt-6 text-xs text-muted-foreground">
        Privacy note: MaintainerOS only reads public GitHub data you grant access to and writes only
        when you explicitly confirm. No analytics or third-party tracking on this page.
      </p>
    </footer>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "1",
      title: "Connect a repository",
      body: "Sign in with GitHub and pick a repo. MaintainerOS only reads — never writes — until you approve a specific action.",
    },
    {
      n: "2",
      title: "Sync issues, PRs, contributors",
      body: "Live data lands in your private workspace. You can re-sync at any time.",
    },
    {
      n: "3",
      title: "Review AI drafts",
      body: "Issue triage, PR summaries, changelogs, and docs are generated as editable drafts. Confidence and source data are always shown.",
    },
    {
      n: "4",
      title: "Approve and publish on your terms",
      body: "When you're ready, one click + confirmation posts the approved draft to GitHub. Duplicates are blocked.",
    },
  ];
  return (
    <section className="py-20 border-t border-border/60">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <SectionEyebrow>How it works</SectionEyebrow>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
          Four small steps. No surprises.
        </h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((s) => (
            <div key={s.n} className="panel rounded-xl p-5">
              <div className="size-7 rounded-md bg-primary/15 text-primary grid place-items-center font-mono text-xs ring-1 ring-primary/30">
                {s.n}
              </div>
              <h3 className="mt-3 font-medium text-sm">{s.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ApprovalFirst() {
  const items = [
    "Every AI output is a draft until you approve or edit it.",
    "Every GitHub write requires a confirmation dialog with a full preview.",
    "Duplicate posts are blocked using the audit log.",
    "GitHub releases are always created as drafts, never published.",
    "Demo mode never calls GitHub write functions.",
  ];
  return (
    <section className="py-20 border-t border-border/60">
      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <SectionEyebrow>
            <ShieldCheck className="size-3" /> Approval-first AI
          </SectionEyebrow>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
            GitHub write actions are always confirmed.
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            MaintainerOS treats your repository like production. Nothing posts to GitHub without an
            explicit click, a confirmation dialog showing the exact payload, and an audit log entry.
          </p>
        </div>
        <ul className="space-y-3">
          {items.map((t) => (
            <li key={t} className="flex items-start gap-3 panel rounded-lg p-3.5">
              <Check className="size-4 mt-0.5 text-primary shrink-0" />
              <span className="text-sm text-foreground">{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function DemoSection() {
  const navigate = useNavigate();
  const tryDemo = () => {
    enableDemoMode();
    navigate({ to: "/app" });
  };
  return (
    <section className="py-20 border-t border-border/60">
      <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
        <SectionEyebrow>
          <PlayCircle className="size-3" /> Demo mode
        </SectionEyebrow>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
          See the whole product, no GitHub required.
        </h2>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Demo mode loads a clearly fictional repository so you can explore every screen — triage,
          PR summaries, changelog, docs, audit log — without connecting GitHub. Publishing and sync
          are disabled and every AI output is labeled "Demo AI output".
        </p>
        <Button size="lg" className="mt-6" onClick={tryDemo}>
          <PlayCircle className="size-4" /> Try the demo
        </Button>
      </div>
    </section>
  );
}

function Roadmap() {
  const lanes = [
    {
      title: "Shipped",
      items: [
        "GitHub read sync",
        "AI issue triage",
        "PR summaries",
        "Changelog drafts",
        "Documentation generator",
        "Approval-gated GitHub publishing",
        "AI Action Log",
        "Trust Center",
      ],
    },
    {
      title: "Next",
      items: [
        "Direct doc commits via PR",
        "Repository health trends",
        "Triage rule presets",
        "Contributor outreach helpers",
      ],
    },
    {
      title: "Exploring",
      items: [
        "Multi-repo dashboards",
        "Self-hosted deployment guide",
        "Bring-your-own AI provider",
      ],
    },
  ];
  return (
    <section className="py-20 border-t border-border/60">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <SectionEyebrow>
          <Map className="size-3" /> Roadmap
        </SectionEyebrow>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
          Honest about what exists today.
        </h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {lanes.map((l) => (
            <div key={l.title} className="panel rounded-xl p-5">
              <h3 className="font-medium text-sm">{l.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {l.items.map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="size-3.5 mt-0.5 text-primary shrink-0" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
      <span className="size-1 rounded-full bg-primary" />
      {children}
    </div>
  );
}
