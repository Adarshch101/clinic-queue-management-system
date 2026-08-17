import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    return NextResponse.json({
      tokenId: token.id,
      tokenNumber: token.tokenNumber,
      status: token.status,
      patientName: token.patient.name,
      doctorName: token.doctor.name,
      clinicName: token.clinic.name,
      patientsAhead,
      estimatedWait,
    });
  } catch (error) {
    console.error('API track queue error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
