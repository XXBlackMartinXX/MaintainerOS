import { createFileRoute, redirect } from "@tanstack/react-router";
import { enableDemoMode } from "@/hooks/use-demo-mode";

export const Route = createFileRoute("/demo")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      enableDemoMode();
    }
    throw redirect({ to: "/app" });
  },
});
