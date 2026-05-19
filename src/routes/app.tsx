import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { TopNav } from "@/components/top-nav";
import { DemoBanner } from "@/components/demo-banner";
import { ProductTour } from "@/components/product-tour";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    // Allow demo mode visitors without a session
    if (!data.session && typeof window !== "undefined" && window.localStorage.getItem("mos.demoMode") !== "1") {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  useDemoMode();
  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DemoBanner />
        <TopNav />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <ProductTour />
    </div>
  );
}
