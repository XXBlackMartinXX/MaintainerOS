import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "(server)";

  // Safe log: message + route only, never tokens/secrets.
  console.error(`[route-error] ${pathname}:`, error?.message ?? error);

  const resetDemoMode = () => {
    try {
      window.localStorage.removeItem("mos.demoMode");
    } catch {
      /* ignore */
    }
    window.location.assign("/");
  };

  const clearLocalState = () => {
    try {
      const keep = new Set<string>();
      const toRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith("maintainer-os.") && !keep.has(k)) toRemove.push(k);
        if (k === "mos.demoMode") toRemove.push(k);
      }
      toRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    window.location.assign("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong while rendering{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">{pathname}</code>.
        </p>
        {error?.message && (
          <p className="mt-2 text-xs text-muted-foreground/80 break-words">
            {error.message}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
          <a
            href="/demo"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Demo dashboard
          </a>
          <button
            onClick={resetDemoMode}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Reset demo mode
          </button>
          <button
            onClick={clearLocalState}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Clear local app state
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MaintainerOS — AI operations center for open-source maintainers" },
      {
        name: "description",
        content:
          "MaintainerOS gives maintainers AI-powered issue triage, PR summaries, changelogs, contributor insights, and repo health analytics in one focused dashboard.",
      },
      { name: "author", content: "MaintainerOS" },
      {
        property: "og:title",
        content: "MaintainerOS — AI operations center for open-source maintainers",
      },
      {
        property: "og:description",
        content:
          "Run your open-source project like a world-class engineering team. Open source, privacy-conscious, transparent AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors closeButton />
    </QueryClientProvider>
  );
}
