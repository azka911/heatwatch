"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

function AuthCallbackInner() {
  const router = useRouter();

  useEffect(() => {
    // Implicit flow handles session automatically
    // Just redirect to login after a short delay
    const timer = setTimeout(() => {
      router.replace("/login?verified=1");
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="text-sm font-semibold text-slate-900">
          Email verified!
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Redirecting you to sign in...
        </div>
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