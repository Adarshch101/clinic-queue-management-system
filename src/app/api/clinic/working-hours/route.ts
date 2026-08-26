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

    const workingHours = await prisma.workingHours.findMany({
      where: { clinicId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return NextResponse.json({ workingHours });
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
    const { clinicId, dayOfWeek, startTime, endTime, isClosed } = body;

    if (!clinicId || dayOfWeek === undefined || startTime === undefined || endTime === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ADMIN can only update their own clinic; SUPER_ADMIN can update any
    const hasAccess = await sessionHasClinicAccess(session, clinicId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
    }

    // Check if entry already exists
    const existing = await prisma.workingHours.findFirst({
      where: { clinicId, dayOfWeek },
    });

    // Delete existing and create new
    if (existing) {
      await prisma.workingHours.delete({ where: { id: existing.id } });
    }
    const workingHours = await prisma.workingHours.create({
      data: {
        clinicId,
        dayOfWeek,
        startTime,
        endTime,
        isClosed,
      },
    });

    return NextResponse.json({ workingHours, success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}