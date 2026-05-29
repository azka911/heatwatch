import AppShell from "@/components/layout/AppShell";
import { DashboardProvider } from "@/context/DashboardContext";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <AppShell>{children}</AppShell>
    </DashboardProvider>
  );
}
