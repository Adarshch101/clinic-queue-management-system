import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json({ error: 'Missing clinicId' }, { status: 400 });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        profile: true,
        doctors: true,
        queueTokens: {
          where: { status: 'WAITING' },
        },
      },
    });

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    return NextResponse.json(clinic);
  } catch (error: unknown) {
    console.error('API Clinic Details error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
