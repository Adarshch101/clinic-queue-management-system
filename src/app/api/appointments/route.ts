import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/apiAuth';

type AppointmentRecord = {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  dateTime: Date;
  reasonForVisit: string | null;
  status: string;
  patient?: { name: string } | null;
  doctor?: { name: string } | null;
};

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json({ error: 'clinicId is required' }, { status: 400 });
    }

    let appointments: AppointmentRecord[];

    if (session.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: session.userId } });
      if (!patient) return NextResponse.json([]);

      appointments = await prisma.appointment.findMany({
        where: { patientId: patient.id, clinicId },
        include: { doctor: true },
        orderBy: { dateTime: 'asc' },
      });
    } else if (session.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId: session.userId } });
      if (!doctor) return NextResponse.json([]);

      appointments = await prisma.appointment.findMany({
        where: { doctorId: doctor.id, clinicId },
        include: { patient: true },
        orderBy: { dateTime: 'asc' },
      });
    } else {
      // Receptionist / Admin: Get all scheduled appointments for their clinic
      appointments = await prisma.appointment.findMany({
        where: { clinicId },
        include: { patient: true, doctor: true },
        orderBy: { dateTime: 'asc' },
      });
    }

    // Format appointments to match frontend interface
    const formatted = appointments.map((appt) => ({
      id: appt.id,
      clinicId: appt.clinicId,
      patientId: appt.patientId,
      patientName: appt.patient?.name || 'Walk-in Patient',
      doctorId: appt.doctorId,
      doctorName: appt.doctor?.name || 'Dr. Physician',
      dateTime: appt.dateTime.toISOString(),
      reason: appt.reasonForVisit,
      status: appt.status,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireRole(request, ['PATIENT', 'RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const body = await request.json();
    const { doctorId, dateTime, reason, clinicId } = body;

    if (!doctorId || !dateTime || !reason) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Resolve the patient from the session (never trust a client-supplied patientId)
    const patient = await prisma.patient.findUnique({ where: { userId: session.userId } });
    if (!patient) {
      return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 });
    }

    const appt = await prisma.appointment.create({
      data: {
        clinicId: clinicId || patient.clinicId,
        patientId: patient.id,
        doctorId,
        dateTime: new Date(dateTime),
        reasonForVisit: reason,
        status: 'SCHEDULED',
      },
      include: {
        doctor: true,
      },
    });

    return NextResponse.json({
      id: appt.id,
      clinicId: appt.clinicId,
      patientId: appt.patientId,
      patientName: 'Self',
      doctorId: appt.doctorId,
      doctorName: appt.doctor.name,
      dateTime: appt.dateTime.toISOString(),
      reason: appt.reasonForVisit,
      status: appt.status,
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// Handles cancellation
export async function PATCH(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const body = await request.json();
    const { appointmentId, status } = body;

    if (!appointmentId || !status) {
      return NextResponse.json({ error: 'Missing appointmentId or status' }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Patients may only cancel their own appointments
    if (session.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: session.userId } });
      if (!patient || patient.id !== appointment.patientId) {
        return NextResponse.json({ error: 'You can only cancel your own appointment' }, { status: 403 });
      }
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}