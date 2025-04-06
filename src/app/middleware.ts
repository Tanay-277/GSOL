import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Define routes that should always be accessible without authentication
const publicRoutes = [
  "/",
  "/signin",
  "/api/auth",
  "/api/inngest",
  "/favicon.ico",
  // Add necessary public assets/images
];

// Define routes that require additional safeguards for mental health content
const sensitiveRoutes = [
  "/history",
  "/onboarding",
  "/api/analyse-responses",
  "/api/generate-questions",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // For API routes, apply rate limiting and security headers
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();

    // Apply security headers to API responses
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");

    return response;
  }

  // Get the token for authenticated routes
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect to sign in page if not authenticated
  if (!token) {
    const url = new URL("/signin", request.url);
    url.searchParams.set("callbackUrl", encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // Additional checks for sensitive mental health routes
  if (sensitiveRoutes.some((route) => pathname.startsWith(route))) {
    // Apply additional headers for sensitive health information
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    // Could implement additional consent verification here for sensitive routes

    return response;
  }

  // Default: proceed with request
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
