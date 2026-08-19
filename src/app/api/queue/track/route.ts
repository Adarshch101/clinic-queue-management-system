import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sessionHasClinicAccess } from '@/lib/apiAuth';
import { getSessionFromRequest } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
      return NextResponse.json({ error: 'Missing tokenId' }, { status: 400 });
    }

    const token = await prisma.queueToken.findUnique({
      where: { id: tokenId },
      include: {
        patient: true,
        doctor: true,
        clinic: true,
      },
    });

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Calculate patients ahead in the queue (WAITING status tokens created before this one)
    const patientsAhead = await prisma.queueToken.count({
      where: {
        doctorId: token.doctorId,
        status: 'WAITING',
        createdAt: { lt: token.createdAt },
      },
    });

    const avgTime = token.doctor.averageConsultationTime || 12;
    const estimatedWait = patientsAhead * avgTime;

    // Patient name is PHI. Only expose it to the owning patient (via their
    // signed session) or to staff with clinic access; anonymous trackers
    // receive aggregate wait information only.
    const session = getSessionFromRequest(request);
    const isOwner = !!session && session.userId === token.patient.userId;
    const isStaffWithAccess =
      !!session && session.role !== 'PATIENT' && sessionHasClinicAccess(session, token.clinicId);

    const response: Record<string, unknown> = {
      tokenId: token.id,
      tokenNumber: token.tokenNumber,
      status: token.status,
      doctorName: token.doctor.name,
      clinicName: token.clinic.name,
      patientsAhead,
      estimatedWait,
    };

    if (isOwner || isStaffWithAccess) {
      response.patientName = token.patient.name;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('API track queue error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}