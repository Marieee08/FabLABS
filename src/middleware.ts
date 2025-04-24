// middleware.ts
import { authMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default authMiddleware({
  afterAuth(auth, req) {
    // If not signed in and trying to access protected routes, redirect to sign-in
    if (!auth.userId) {
      const protectedPaths = [
        '/user-dashboard',
        '/msme-schedule',
        '/student-schedule',
        '/admin-dashboard',
        '/teacher-dashboard',
        '/survey',
        '/cashier-dashboard'
      ];

      if (protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
        const signUpUrl = new URL('/sign-up', req.url);
        signUpUrl.searchParams.set('redirect_url', req.url);
        return NextResponse.redirect(signUpUrl);
      }
    }

    return NextResponse.next();
  },

  publicRoutes: [
    '/',
    '/sign-in',
    '/sign-in/(.*)',
    '/sign-up',
    '/sign-up/(.*)',
    '/contact',
    '/api/new-user',
    '/api/auth/check-roles'
  ],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};