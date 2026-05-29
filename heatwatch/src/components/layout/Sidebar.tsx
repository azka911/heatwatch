"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Flame,
  BookOpen,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import NavItem from "./NavItem";
import { cn } from "@/lib/utils/cn";
import Image from "next/image";

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/hotspots", label: "Hotspots", icon: Flame },
    { href: "/methodology", label: "Methodology", icon: BookOpen },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const desktopWidth = collapsed ? "w-[88px]" : "w-[280px]";

  const Brand = ({ compact }: { compact: boolean }) => (
    <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
      <Image
        src="/nav_logo.svg"
        alt="HeatWatch logo"
        width={24}
        height={24}
      />


      {!compact && (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-m font-semibold text-slate-900">
            HeatWatch
          </div>
          <div className="truncate text-xs text-slate-500">
            Urban Heat Dashboard
          </div>
        </div>
      )}
    </Link>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          aria-label="Close navigation overlay"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed z-50 h-full md:hidden",
          "top-0 left-0 w-[280px]",
          "transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "bg-white border-r border-slate-200"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <Brand compact={false} />
          <button
            aria-label="Close navigation"
            onClick={onCloseMobile}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3 py-3">
          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Navigation
          </div>

          <nav className="space-y-1">
            {nav.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname === item.href}
                collapsed={false}
                onClick={onCloseMobile}
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-200 p-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">
              Study area
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Locked to <span className="font-medium">Kuala Lumpur</span>.
            </p>
          </div>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen md:flex md:flex-col",
          desktopWidth,
          "transition-[width] duration-200",
          "bg-white border-r border-slate-200"
        )}
      >
        <div className="flex h-18 items-center px-4 border-b border-slate-200">
          <Brand compact={collapsed} />

          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapsed}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="px-3 py-3">
          {!collapsed && (
            <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Navigation
            </div>
          )}

          <nav className="space-y-1">
            {nav.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={
                  pathname === item.href ||
                  pathname?.startsWith(item.href + "/")
                }
                collapsed={collapsed}
              />
            ))}
          </nav>
        </div>

        
      </aside>
    </>
  );
}
