import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Public routes that don't require authentication
  const publicPaths = [
    '/signin',
    '/register',
    '/auth-error',
    '/',
    '/api/auth',
  ];
  
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || 
    path.startsWith(publicPath + '/') || 
    path.startsWith('/api/auth/')
  );

  // Special handling for NextAuth API routes
  if (path.startsWith('/api/auth/')) {
    // Allow all NextAuth routes
    return NextResponse.next();
  }
  
  // Add response headers for all requests to help with CORS and caching issues
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  
  if (isPublicPath) {
    return response;
  }

  // For authenticated routes, check for a valid session
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // If no token and trying to access protected route, redirect to signin
  if (!token && !isPublicPath) {
    // Use relative URL for redirects to work properly in all environments
    const signinUrl = new URL('/signin', req.url);
    signinUrl.searchParams.set('callbackUrl', encodeURI(req.url));
    
    return NextResponse.redirect(signinUrl);
  }
  
  return response;
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    // Match all paths except static files, _next, favicon.ico, etc.
    '/((?!_next/static|_next/image|favicon.ico|logo|images|public).*)',
  ],
};
