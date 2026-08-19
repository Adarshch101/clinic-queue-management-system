import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RateLimiter } from '@/lib/backend/middleware/rateLimiter';
import { resolveProfile } from '@/lib/resolveProfile';
import { createSessionToken } from '@/lib/session';

/**
 * DEV-ONLY authentication fallback used when Supabase Auth is unreachable.
 *
 * WARNING: This endpoint intentionally skips password verification and must
 * never be enabled outside isolated development environments. It is hard-
 * disabled in production. When enabled it mints a signed server-side session
 * cookie so the rest of the (now RBAC-protected) profile flow keeps working.
 */
export async function POST(request: Request) {
  try {
    // This endpoint bypasses password verification entirely, so it must be
    // explicitly enabled via env flag and is disabled in production.
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_LOGIN_FALLBACK !== 'true') {
      return NextResponse.json({ error: 'Login fallback is disabled' }, { status: 403 });
    }

    // Rate limit login attempts to 10 per IP per 15 minutes
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
    try {
      RateLimiter.checkLimit(`rate_login_${clientIp}`, 10, 15 * 60 * 1000);
    } catch {
      return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let authUser: { id: string; email: string; name: string } | null = null;

    // 1. Search for ClinicAdmin
    const admin = await prisma.clinicAdmin.findFirst({ where: { email } });
    if (admin) {
      authUser = { id: admin.userId, email: admin.email, name: admin.name };
    }

    // 2. Search for Doctor
    if (!authUser) {
      const doc = await prisma.doctor.findFirst({ where: { email } });
      if (doc) {
        authUser = { id: doc.userId, email: doc.email, name: doc.name };
      }
    }

    // 3. Search for Receptionist
    if (!authUser) {
      const recep = await prisma.receptionist.findFirst({ where: { email } });
      if (recep) {
        authUser = { id: recep.userId, email: recep.email, name: recep.name };
      }
    }

    // 4. Super Admin
    if (!authUser) {
      const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@q-clinix.com').toLowerCase();
      if (email.toLowerCase() === superAdminEmail) {
        const id = `super-admin-${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        authUser = { id, email, name: 'Super Admin' };
      }
    }

    if (!authUser) {
      return NextResponse.json({ error: 'Invalid email or password credentials' }, { status: 401 });
    }

    // Resolve role/clinic server-side and mint a signed session cookie so the
    // RBAC-protected endpoints can authorize the user on subsequent requests.
    const profile = await resolveProfile(authUser.id, authUser.email);
    const sessionToken = createSessionToken({
      userId: authUser.id,
      role: profile.role,
      clinicId: profile.clinicId,
      clinicStatus: profile.clinicStatus,
    });

    const response = NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        user_metadata: { name: authUser.name },
      },
    });

    response.cookies.set('q-clinix-session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: String(process.env.NODE_ENV) === 'production',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('API login-fallback error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}