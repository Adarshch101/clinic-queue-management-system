import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const patientId = searchParams.get('patientId');

    let resolvedPatientId = patientId;

    if (userId) {
      const patient = await prisma.patient.findUnique({ where: { userId } });
      if (patient) resolvedPatientId = patient.id;
    }

    if (!resolvedPatientId) {
      return NextResponse.json([]);
    }

    const visits = await prisma.visit.findMany({
      where: { patientId: resolvedPatientId },
      include: { patient: true, doctor: true },
      orderBy: { visitDate: 'desc' },
    });

    const formatted = visits.map((v: any) => ({
      id: v.id,
      patientId: v.patientId,
      patientName: v.patient?.name || 'Patient',
      doctorName: v.doctor?.name || 'Dr. Physician',
      date: v.visitDate.toISOString().split('T')[0],
      diagnosis: v.diagnosis,
      prescription: v.prescriptions.split(',').map((p: string) => p.trim()).filter(Boolean),
      notes: v.notes,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching visits:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
