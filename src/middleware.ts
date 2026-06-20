import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const url = request.nextUrl;
  const pathname = url.pathname;
  const lowercasePath = pathname.toLowerCase();

  // Extract tenant slug from host header
  let tenantSlug = "";
  const cleanHost = hostname.split(":")[0].toLowerCase();
  const parts = cleanHost.split(".");
  const reservedSubdomains = ["admin", "api", "www", "main"];

  if (parts.length === 2 && parts[1] === "localhost") {
    if (!reservedSubdomains.includes(parts[0])) {
      tenantSlug = parts[0];
    }
  } else if (parts.length >= 3) {
    if (!reservedSubdomains.includes(parts[0])) {
      tenantSlug = parts[0];
    }
  }

  // Skip middleware for Next.js internals, API routes, and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Clone headers and inject tenant slug if present
  const requestHeaders = new Headers(request.headers);
  if (tenantSlug) {
    requestHeaders.set("x-tenant-slug", tenantSlug);
  }

  // Handle admin subdomain routing
  if (hostname.startsWith("admin.")) {
    if (pathname === "/" || pathname === "/login") {
      return NextResponse.rewrite(new URL("/admin-login", request.url), {
        request: {
          headers: requestHeaders,
        },
      });
    }
    // Only prepend /admin-dashboard if the path doesn't already start with it
    if (!pathname.startsWith("/admin-dashboard") && !pathname.startsWith("/admin-login")) {
      return NextResponse.rewrite(
        new URL("/admin-dashboard" + pathname, request.url),
        {
          request: {
            headers: requestHeaders,
          },
        }
      );
    }
  }

  // Skip lowercase redirect for dashboard routes that use camelCase
  const camelCaseRoutes = [
    "/uniDashboard",
    "/vendorDashboard",
    "/food-ordering-uniDashboard",
  ];

  const isCamelCaseRoute = camelCaseRoutes.some(route =>
    pathname.startsWith(route)
  );

  // If the current path is not already in lowercase, redirect to the lowercase version
  // BUT skip this for camelCase routes
  if (!isCamelCaseRoute && pathname !== lowercasePath) {
    return NextResponse.redirect(new URL(lowercasePath, request.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: "/:path*", // Apply this middleware to all paths
};
