import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const isMiniPay =
    userAgent.includes("MiniPay") || request.headers.get("x-minipay-wallet");

  // Exempt API routes and static files from MiniPay check
  if (
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // If not in MiniPay, redirect to a "MiniPay Required" page
  if (!isMiniPay) {
    const url = request.nextUrl.clone();
    url.pathname = "/minipay-required";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
