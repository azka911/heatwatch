import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;

  // Protect dashboard and app pages - "/" is now the public landing page
  const isProtected =
    path.startsWith("/dashboard") ||
    path.startsWith("/hotspots") ||
    path.startsWith("/methodology") ||
    path.startsWith("/profile") ||
    path.startsWith("/analysis") ||
    path.startsWith("/interventions") ||
    path.startsWith("/data") ||
    path.startsWith("/settings");

  if (isProtected && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // If already logged in and trying to access login, redirect to dashboard
  if (path === "/login" && user) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/hotspots/:path*", "/methodology/:path*", "/profile/:path*", "/analysis/:path*", "/interventions/:path*", "/data/:path*", "/settings/:path*", "/login"],
};