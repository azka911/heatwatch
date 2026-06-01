export default function CheckEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-sky-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Check your email
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          If this email address is not already registered, we've sent a verification link.<br />
          Please check your inbox and verify your email to continue.
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-blue-600 hover:underline">
            Sign in here
          </a>
        </p>
        <p className="mt-6 text-xs text-slate-500">
          You can close this page after verification.
        </p>
      </div>
    </main>
  );
}