export default function CheckEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-sky-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Check your email
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          We’ve sent you a verification link.<br />
          Please verify your email to continue.
        </p>

        <p className="mt-6 text-xs text-slate-500">
          You can close this page after verification.
        </p>
      </div>
    </main>
  );
}
