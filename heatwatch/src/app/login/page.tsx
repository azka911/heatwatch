"use client";

import { Suspense } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import Image from "next/image";

type Mode = "signin" | "signup";

function validatePassword(pw: string) {
  if (pw.length < 6) return "Password must be at least 6 characters.";
  return null;
}

function AuthPageInner() {
  const router = useRouter();
  const search = useSearchParams();

  const next = search.get("next") || "/dashboard";
  const verified = search.get("verified");

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (verified === "1") {
      setMessage("Email verified. Please sign in to continue.");
      setMode("signin");
    }
  }, [verified]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setMessage(error.message); return; }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").upsert(
            { id: user.id, full_name: (user.user_metadata?.full_name as string | undefined) ?? null },
            { onConflict: "id" }
          );
        }
        router.replace(next);
        return;
      }

      const pwError = validatePassword(password);
      if (pwError) { setMessage(pwError); return; }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "http://localhost:3000/auth/callback",
          data: { full_name: fullName },
        },
      });

      if (error) { setMessage(error.message); return; }
      router.push("/auth/check-email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-sky-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/nav_logo.svg" alt="HeatWatch logo" width={35} height={35} />
          <h1 className="text-xl font-semibold text-slate-900">Welcome to HeatWatch</h1>
          <p className="mt-1 text-sm text-slate-500">Urban Heat & Hotspot Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                required />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-slate-700">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
              required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
              required />
            {mode === "signup" && (
              <p className="mt-1 text-xs text-slate-500">Password must be at least 6 characters.</p>
            )}
          </div>

          {message && (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">{message}</div>
          )}

          <button type="submit" disabled={loading}
            className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            {loading ? (mode === "signin" ? "Signing in..." : "Creating account...") : (mode === "signin" ? "Sign In" : "Sign Up")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          {mode === "signin" ? (
            <>New to HeatWatch?{" "}
              <button type="button" onClick={() => setMode("signup")} className="font-medium text-blue-600 hover:underline">Create an account</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button type="button" onClick={() => setMode("signin")} className="font-medium text-blue-600 hover:underline">Sign in</button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthPageInner />
    </Suspense>
  );
}