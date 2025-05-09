import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The middleware is no longer needed to restrict access to MiniPay only
// We'll pass through all requests and let the client-side handle wallet connections
export function middleware(request: NextRequest) {
  // We're no longer redirecting non-MiniPay users
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Empty matcher since we're not restricting access anymore
    // Keep this in place in case we need to add restrictions in the future
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
