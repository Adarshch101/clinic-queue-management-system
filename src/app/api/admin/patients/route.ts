import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, sessionHasClinicAccess } from '@/lib/apiAuth';

// Clinic patient roster for the admin dashboard's Patient Directory.
// Admin/SUPER_ADMIN only, scoped to the caller's own clinic (fail-closed).
export async function GET(request: Request) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json({ error: 'clinicId is required' }, { status: 400 });
    }

    if (!sessionHasClinicAccess(session, clinicId)) {
      return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
    }

    const patients = await prisma.patient.findMany({
      where: { clinicId },
      orderBy: { name: 'asc' },
    });

    const formatted = patients.map((p) => ({
      id: p.id,
      clinicId: p.clinicId,
      name: p.name,
      email: p.email || '',
      phone: p.phone,
      age: p.age,
      gender: p.gender,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching clinic patients:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}