"use client";

import { useEffect, useMemo, useState } from "react";
import { Menu } from "lucide-react";
import LogoutButton from "./LogoutButton";
import { useProfile } from "@/context/ProfileContext";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type HeaderProps = {
  title: string;
  onOpenMobileNav: () => void;
};

export default function Header({ title, onOpenMobileNav }: HeaderProps) {
  const { profile } = useProfile();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    let alive = true;

    async function loadName() {
      if (profile?.full_name) {
        if (alive) setDisplayName(profile.full_name);
        return;
      }

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      const metaName =
        (user?.user_metadata?.full_name as string | undefined) ??
        (user?.user_metadata?.name as string | undefined);

      if (alive) setDisplayName(metaName || "");
    }

    loadName();
    return () => { alive = false; };
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

        {/* Right: logout only */}
        <div className="flex items-center gap-2">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}