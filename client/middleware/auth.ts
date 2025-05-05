import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected routes that require authentication
const protectedRoutes = [
  "/active-loan",
  "/apply-loan",
  "/credit-score",
  "/deposit",
  "/earnings",
  "/loan-history",
  "/transactions",
  "/withdraw",
];

export function middleware(request: NextRequest) {
  // Get auth token from cookies or headers
  const token =
    request.cookies.get("auth_token")?.value ||
    request.headers.get("Authorization")?.split(" ")[1];

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // If protected route and no token, redirect to home page
  if (isProtectedRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Continue with the request if authenticated or public route
  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
