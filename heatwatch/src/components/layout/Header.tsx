"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Menu,
  Bell,
  Globe,
  Moon,
  MapPinned,
  ChevronDown,
} from "lucide-react";
import LogoutButton from "./LogoutButton";
import { useProfile } from "@/context/ProfileContext";
import { cn } from "@/lib/utils/cn";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type HeaderProps = {
  title: string;
  onOpenMobileNav: () => void;
};

export default function Header({ title, onOpenMobileNav }: HeaderProps) {
  const { profile, loading } = useProfile();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    let alive = true;

    async function loadName() {
      // 1) Prefer DB profile name
      if (profile?.full_name) {
        if (alive) setDisplayName(profile.full_name);
        return;
      }

      // 2) Fallback to auth metadata (works even if profiles row doesn't exist yet)
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      const metaName =
        (user?.user_metadata?.full_name as string | undefined) ??
        (user?.user_metadata?.name as string | undefined);

      if (alive) setDisplayName(metaName || "");
    }

    loadName();
    return () => {
      alive = false;
    };
  }, [profile?.full_name, supabase]);

  return (
    <header className="h-18 border-b border-slate-200 flex items-center">
      <div className="mx-auto flex w-full max-w-screen items-center gap-3 px-4 py-3 md:px-6">
        {/* Mobile hamburger */}
        <button
          aria-label="Open navigation"
          onClick={onOpenMobileNav}
          className="rounded-lg p-2 hover:bg-slate-100 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Left: title */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">
            Hello{displayName ? `, ${displayName}` : ""}
          </h1>
          <p className="truncate text-xs text-slate-500">
            Urban Heat & Hotspot Dashboard (Kuala Lumpur, Malaysia)
          </p>
        </div>

        {/* SPACER */}
        <div className="flex-1" />

        {/* Right: city pill + icons + user */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2",
              "text-sm text-slate-700"
            )}
          >
            <MapPinned className="h-4 w-4 text-slate-600" />
            <span className="text-slate-500">City</span>
            <span className="font-medium">Kuala Lumpur</span>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </div>

          <button
            type="button"
            aria-label="Theme (placeholder)"
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            <Moon className="h-4 w-4 text-slate-600" />
          </button>

          <button
            type="button"
            aria-label="Language (placeholder)"
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            <Globe className="h-4 w-4 text-slate-600" />
          </button>

          <button
            type="button"
            aria-label="Notifications (placeholder)"
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 hover:bg-slate-50"
          >
            <Bell className="h-4 w-4 text-slate-600" />
          </button>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
