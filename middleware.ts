import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the preferred language from cookie or default to 'es'
  const preferredLanguage =
    request.cookies.get("preferred-language")?.value || "es";

  // Set the locale header for next-intl
  const response = NextResponse.next();
  response.headers.set("x-locale", preferredLanguage);

  return response;
}

export const config = {
  // Match all routes except api, static files, and images
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
