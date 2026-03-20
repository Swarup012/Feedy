import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware to handle subdomain-based multi-tenancy
export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  
  // Get subdomain from hostname
  // Examples:
  // - acme.faddy.site -> subdomain: acme
  // - localhost:5173 -> subdomain: null
  // - www.faddy.site -> subdomain: null
  
  const parts = hostname.split(".");
  let subdomain: string | null = null;
  
  // Handle production domains (e.g., acme.faddy.site)
  if (parts.length >= 3 && !hostname.includes("localhost")) {
    subdomain = parts[0];
    
    // Ignore www and common subdomains
    if (subdomain === "www" || subdomain === "api" || subdomain === "admin") {
      subdomain = null;
    }
  }
  
  // Handle development (localhost with subdomain simulation)
  // You can test with: subdomain.localhost:5173
  if (hostname.includes("localhost") && parts.length > 1 && parts[0] !== "localhost") {
    subdomain = parts[0];
  }
  
  // Add subdomain to request headers so we can access it in API routes and pages
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-subdomain", subdomain || "");
  
  // Clone the URL and add subdomain as a search param (alternative method)
  const newUrl = url.clone();
  
  // If there's a subdomain, we might want to:
  // 1. Validate it exists in the database
  // 2. Fetch organization data
  // 3. Restrict access based on organization
  
  // For now, just pass it through
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // Optionally set a cookie for the subdomain
  if (subdomain) {
    response.cookies.set("x-subdomain", subdomain, {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }
  
  return response;
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
