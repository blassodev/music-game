import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Get the preferred language from cookie or default to 'es'
  const preferredLanguage =
    request.cookies.get("preferred-language")?.value || "es";

  // Check if this is an admin route
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isAdminLoginPage = request.nextUrl.pathname.startsWith("/admin-login");

  if (isAdminRoute && !isAdminLoginPage) {
    // Check for authentication cookie
    const authCookie = request.cookies.get("pb_auth");

    if (!authCookie) {
      // Redirect to login page if not authenticated
      const loginUrl = new URL(`/admin-login`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Basic validation of auth cookie structure
      const authData = JSON.parse(authCookie.value);
      if (!authData.token || !authData.model) {
        const loginUrl = new URL(`/admin-login`, request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      // Invalid JSON in auth cookie, redirect to login
      const loginUrl = new URL(`/admin-login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If user is authenticated and trying to access login page, redirect to admin
  if (isAdminLoginPage) {
    const authCookie = request.cookies.get("pb_auth");
    if (authCookie) {
      try {
        const authData = JSON.parse(authCookie.value);
        if (authData.token && authData.model) {
          const adminUrl = new URL(`/admin`, request.url);
          return NextResponse.redirect(adminUrl);
        }
      } catch {
        // Invalid auth cookie, allow access to login page
      }
    }
  }

  // Set the locale header for next-intl
  const response = NextResponse.next();
  response.headers.set("x-locale", preferredLanguage);

  return response;
}

export const config = {
  // Match all routes except api, static files, and images
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
