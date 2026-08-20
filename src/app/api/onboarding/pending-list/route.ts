import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/apiAuth';

export async function GET(request: Request) {
  const auth = requireRole(request, ['SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  try {
    // Reviewing clinic verification/onboarding queues is a platform-wide,
    // SUPER_ADMIN-only responsibility.
    const clinics = await prisma.clinic.findMany({
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

    // Point document links at the auth-gated endpoint instead of the on-disk key.
    const clinicDtos = clinics.map((c) => ({
      ...c,
      documents: c.documents.map((d) => ({
        ...d,
        fileUrl: `/api/files/document?documentId=${d.id}`,
      })),
    }));

    return NextResponse.json(clinicDtos);
  } catch (error: unknown) {
    console.error('Fetch pending clinics list error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
