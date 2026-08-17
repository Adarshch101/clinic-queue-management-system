import { NextResponse, NextRequest } from 'next/server';
import { verifySessionToken, SessionPayload } from '@/lib/session';

const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-DNS-Prefetch-Control': 'off',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; " +
    "font-src 'self' data:; connect-src 'self' https: wss: ws:; " +
    "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve our signed session cookie
  const sessionCookie = request.cookies.get('q-clinix-session')?.value;

  let sessionData: SessionPayload | null = null;

  if (sessionCookie) {
    // Verify the HMAC signature and expiry. Forged/tampered cookies yield null.
    sessionData = verifySessionToken(sessionCookie);
  }

  // 1. If user is logged in, redirect them away from Guest routes (login, register)
  if (sessionData && sessionData.role !== 'PATIENT' && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    const roleRedirect = sessionData.role.toLowerCase();
    if (roleRedirect === 'super_admin') {
      return applySecurityHeaders(NextResponse.redirect(new URL('/admin/super-dashboard', request.url)));
    }
    return applySecurityHeaders(NextResponse.redirect(new URL(`/${roleRedirect}/dashboard`, request.url)));
  }

  // 2. Protect Dashboards (Receptionist, Doctor, Admin, Super Admin, Patient)
  if (!sessionData) {
    if (
      pathname.startsWith('/receptionist') ||
      pathname.startsWith('/doctor') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/patient')
    ) {
      // Redirect unauthenticated users to login screen
      return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
    }
  } else {
    // Authenticated user checks
    const { role, clinicStatus } = sessionData;

    // Check clinic status restrictions
    if (clinicStatus && clinicStatus !== 'VERIFIED' && role !== 'SUPER_ADMIN') {
      if (clinicStatus === 'PENDING' && !pathname.startsWith('/auth/pending')) {
        return applySecurityHeaders(NextResponse.redirect(new URL('/auth/pending', request.url)));
      }
      if (clinicStatus === 'REJECTED' && !pathname.startsWith('/auth/rejected')) {
        return applySecurityHeaders(NextResponse.redirect(new URL('/auth/rejected', request.url)));
      }
      if (clinicStatus === 'SUSPENDED' && !pathname.startsWith('/auth/suspended')) {
        return applySecurityHeaders(NextResponse.redirect(new URL('/auth/suspended', request.url)));
      }
    }

    // Role-based Access Control (RBAC) Route guards
    if (pathname.startsWith('/receptionist') && !['RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/auth/denied', request.url)));
    }

    if (pathname.startsWith('/doctor') && !['DOCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/auth/denied', request.url)));
    }

    if (pathname.startsWith('/patient') && !['PATIENT', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/auth/denied', request.url)));
    }

    if (pathname.startsWith('/admin/super-dashboard') && role !== 'SUPER_ADMIN') {
      return applySecurityHeaders(NextResponse.redirect(new URL('/auth/denied', request.url)));
    }

    if (pathname.startsWith('/admin') && !['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/auth/denied', request.url)));
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

// Matching paths matcher config
export const config = {
  matcher: [
    '/login',
    '/register',
    '/receptionist/:path*',
    '/doctor/:path*',
    '/admin/:path*',
    '/patient/:path*',
  ],
};