import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, sessionHasClinicAccess } from '@/lib/apiAuth';

export async function GET(request: Request) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json({ error: 'Missing clinicId' }, { status: 400 });
    }

    // ADMIN can only access their own clinic; SUPER_ADMIN can access any
    const hasAccess = await sessionHasClinicAccess(session, clinicId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
    }

    const holidays = await prisma.holiday.findMany({
      where: { clinicId },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ holidays });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const body = await request.json();
    const { clinicId, date, description, isClinicClosed } = body;

    if (!clinicId || !date || !description) {
      return NextResponse.json({ error: 'Missing required fields (date, description)' }, { status: 400 });
    }

    // ADMIN can only update their own clinic; SUPER_ADMIN can update any
    const hasAccess = await sessionHasClinicAccess(session, clinicId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
    }

const holiday = await prisma.holiday.create({
      data: {
        clinicId,
        date: new Date(date),
        description,
        isClinicClosed,
      },
    });

    return NextResponse.json({ holiday, success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}