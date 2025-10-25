import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This middleware simply passes through all requests
// since we've removed Clerk authentication
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Configuration for which routes middleware applies to
export const config = {
  matcher: [
    // Skip Next.js static resources
    "/((?!_next/static|_next/image|favicon.ico).*)",
    // Match all API routes
    "/api/(.*)",
  ],
};
