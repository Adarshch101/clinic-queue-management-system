import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, sessionHasClinicAccess } from '@/lib/apiAuth';

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const userId = searchParams.get('userId');

    let resolvedPatientId = patientId;

    // Patients can only ever see their own visits.
    if (session.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: session.userId } });
      if (patient) resolvedPatientId = patient.id;
    } else if (userId) {
      // Staff may look up a patient's visits via the patient's auth userId.
      const patient = await prisma.patient.findUnique({ where: { userId } });
      if (patient) resolvedPatientId = patient.id;
    }

    if (!resolvedPatientId) {
      return NextResponse.json([]);
    }

    // Staff must only access visits of patients belonging to their own clinic.
    if (session.role !== 'PATIENT') {
      const targetPatient = await prisma.patient.findUnique({ where: { id: resolvedPatientId } });
      if (!targetPatient || !sessionHasClinicAccess(session, targetPatient.clinicId)) {
        return NextResponse.json({ error: 'You do not have access to this patient' }, { status: 403 });
      }
    }

    const visits = await prisma.visit.findMany({
      where: { patientId: resolvedPatientId },
      include: { patient: true, doctor: true },
      orderBy: { visitDate: 'desc' },
    });

    const formatted = visits.map((v) => {
      // Front-desk staff do not need full clinical PHI; they only see that a
      // visit occurred. Diagnosis/prescriptions/notes are restricted to the
      // patient themselves and clinical roles (DOCTOR/ADMIN/SUPER_ADMIN).
      const isClinicalViewer = session.role !== 'RECEPTIONIST';

      const base: Record<string, unknown> = {
        id: v.id,
        patientId: v.patientId,
        patientName: v.patient?.name || 'Patient',
        doctorName: v.doctor?.name || 'Dr. Physician',
        date: v.visitDate.toISOString().split('T')[0],
      };

      if (isClinicalViewer) {
        base.diagnosis = v.diagnosis;
        base.prescription = v.prescriptions.split(',').map((p: string) => p.trim()).filter(Boolean);
        base.notes = v.notes;
      }

      return base;
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching visits:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
