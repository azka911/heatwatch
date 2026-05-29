"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

type NavItemProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
};

export default function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onClick,
}: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5",
        "text-sm font-medium transition-colors",
        active
          ? "bg-slate-900 text-white"
          : "text-slate-700 hover:bg-slate-50",
        collapsed && "justify-center"
      )}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          active ? "text-white" : "text-slate-500 group-hover:text-slate-700"
        )}
      />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
