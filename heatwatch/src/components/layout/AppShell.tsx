"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

function titleFromPath(pathname: string) {
  const map: Record<string, string> = {
    "/": "Dashboard",
    "/dashboard": "Dashboard",
    "/hotspots": "Hotspots",
    "/methodology": "Methodology",
    "/settings": "Settings",
    "/profile": "Profile",
  };
  return map[pathname] ?? "HeatWatch";
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageTitle = useMemo(() => titleFromPath(pathname), [pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header title={pageTitle} onOpenMobileNav={() => setMobileOpen(true)} />

          <main className="flex-1 bg-slate-50 pt-2 px px-4 md:pt-4 md:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
