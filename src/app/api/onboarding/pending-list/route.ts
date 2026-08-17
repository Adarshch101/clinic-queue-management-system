import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    // Super admins see all clinics; regular admins only see their own clinic.
    // Non-super-admins must be ADMIN to view onboarding data.
    const isPrivileged = session.role === 'SUPER_ADMIN' || session.role === 'ADMIN';
    if (!isPrivileged) {
      return NextResponse.json({ error: 'You do not have permission to view this data' }, { status: 403 });
    }

    const clinicIdFilter = session.role === 'SUPER_ADMIN' ? undefined : session.clinicId;

    // Fetch all clinics along with their profile, settings, and documents
    const clinics = await prisma.clinic.findMany({
      where: clinicIdFilter ? { id: clinicIdFilter } : undefined,
      include: {
        profile: true,
        documents: true,
        doctors: true,
        verificationRequests: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
        }
      }
    });

    return NextResponse.json(clinics);
  } catch (error: unknown) {
    console.error('Fetch pending clinics list error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
