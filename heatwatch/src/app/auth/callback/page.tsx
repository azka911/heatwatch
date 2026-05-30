"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function finalizeAuth() {
      try {
        const code = params.get("code");
        if (!code) {
          router.replace("/login");
          return;
        }
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        await supabase.auth.signOut();
        router.replace("/login?verified=1");
      } catch (e) {
        setErrorMsg("Failed to complete verification. Please try again.");
      }
    }
    finalizeAuth();
  }, [router, params, supabase]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        {!errorMsg ? (
          <>
            <div className="text-sm font-semibold text-slate-900">
              Verifying your email…
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Please wait while we confirm your account.
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-semibold text-slate-900">
              Verification failed
            </div>
            <div className="mt-2 text-xs text-slate-600">{errorMsg}</div>
            <button
              className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              onClick={() => router.replace("/login")}
              type="button"
            >
              Back to Sign in
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthCallbackInner />
    </Suspense>
  );
}