import "@/styles/globals.css";
import type { Metadata } from "next";
import { ProfileProvider } from "@/context/ProfileContext";

export const metadata: Metadata = {
  title: "HeatWatch",
  description: "Urban Heat & Hotspot Dashboard for Malaysia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-slate-50 text-slate-900 antialiased"
        suppressHydrationWarning
      >
        <ProfileProvider>{children}</ProfileProvider>
      </body>
    </html>
  );
}
