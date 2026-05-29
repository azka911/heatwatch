"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useProfile } from "@/context/ProfileContext";


export default function ProfilePage() {
  const supabase = createSupabaseBrowserClient();
  const { profile, loading, refresh } = useProfile();

  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
  }, [profile?.full_name]);

  async function save() {
    setSaving(true);
    setMsg(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMsg("Not logged in.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    await refresh(); // reload profile so header updates
    setMsg("Saved!");
  }

  return (
    <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold">Profile</h2>
      <p className="mt-1 text-sm text-slate-600">
        Update your display name used in the HeatWatch dashboard.
      </p>

      <div className="mt-4 space-y-2">
        <label className="text-sm font-medium">Full Name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
          disabled={loading || saving}
        />
      </div>

      {msg && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
          {msg}
        </div>
      )}

      <button
        onClick={save}
        disabled={loading || saving}
        className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
