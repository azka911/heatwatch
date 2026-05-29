// "use client";

// import { useEffect, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

// export default function AuthCallbackPage() {
//   const router = useRouter();
//   const params = useSearchParams();
//   const supabase = createSupabaseBrowserClient();
//   const [errorMsg, setErrorMsg] = useState<string | null>(null);

//   useEffect(() => {
//     async function finalizeAuth() {
//       try {
//         // Important: exchange the code in the URL for a session
//         const { error } = await supabase.auth.exchangeCodeForSession(
//           window.location.href
//         );

//         if (error) {
//           setErrorMsg(error.message);
//           return;
//         }

//         const next = params.get("next") || "/dashboard";
//         router.replace("/login?verified=1");
//       } catch (e) {
//         setErrorMsg("Failed to complete verification. Please try again.");
//       }
//     }

//     finalizeAuth();
//   }, [router, params, supabase]);

//   return (
//     <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
//       <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
//         {!errorMsg ? (
//           <>
//             <div className="text-sm font-semibold text-slate-900">
//               Verifying your email…
//             </div>
//             <div className="mt-1 text-xs text-slate-500">
//               Please wait while we complete your sign-in.
//             </div>
//           </>
//         ) : (
//           <>
//             <div className="text-sm font-semibold text-slate-900">
//               Verification failed
//             </div>
//             <div className="mt-2 text-xs text-slate-600">{errorMsg}</div>
//             <button
//               className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
//               onClick={() => router.replace("/login")}
//               type="button"
//             >
//               Back to Sign in
//             </button>
//           </>
//         )}
//       </div>
//     </main>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AuthCallbackPage() {
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

        // ✅ Correct usage: exchange the single "code" param
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        // ✅ You said you want: verified -> go back to Sign In page
        // Also sign out so user isn't "silently logged in" after verification.
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
