import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { enableDemoMode } from "@/hooks/use-demo-mode";

export const Route = createFileRoute("/demo")({
  component: DemoRedirect,
});

function DemoRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    enableDemoMode();
    void navigate({ to: "/app", replace: true });
  }, [navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <p className="text-sm text-muted-foreground">Enabling demo mode…</p>
    </main>
  );
}
