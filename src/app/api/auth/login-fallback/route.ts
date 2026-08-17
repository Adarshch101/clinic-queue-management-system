import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RateLimiter } from '@/lib/backend/middleware/rateLimiter';

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

    // 1. Search for ClinicAdmin
    const admin = await prisma.clinicAdmin.findFirst({
      where: { email }
    });
    if (admin) {
      return NextResponse.json({
        user: {
          id: admin.userId,
          email: admin.email,
          user_metadata: { name: admin.name }
        }
      });
    }

    // 2. Search for Doctor
    const doc = await prisma.doctor.findFirst({
      where: { email }
    });
    if (doc) {
      return NextResponse.json({
        user: {
          id: doc.userId,
          email: doc.email,
          user_metadata: { name: doc.name }
        }
      });
    }

    // 3. Search for Receptionist
    const recep = await prisma.receptionist.findFirst({
      where: { email }
    });
    if (recep) {
      return NextResponse.json({
        user: {
          id: recep.userId,
          email: recep.email,
          user_metadata: { name: recep.name }
        }
      });
    }


    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@q-clinix.com').toLowerCase();
    if (email.toLowerCase() === superAdminEmail) {
      return NextResponse.json({
        user: {
          id: `super-admin-${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          email,
          user_metadata: { name: 'Super Admin' }
        }
      });
    }

    return NextResponse.json({ error: 'Invalid email or password credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
