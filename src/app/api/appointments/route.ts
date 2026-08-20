import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, sessionHasClinicAccess } from '@/lib/apiAuth';

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
    const clinicId = searchParams.get('clinicId') ?? undefined;

    // Staff require a clinic scope; patients get their own appointments
    // across every clinic they have visited.
    if (session.role !== 'PATIENT' && !clinicId) {
      return NextResponse.json({ error: 'clinicId is required' }, { status: 400 });
    }

    // Staff members may only view appointments for their own clinic.
    if (session.role !== 'PATIENT' && !sessionHasClinicAccess(session, clinicId)) {
      return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
    }

    let appointments: AppointmentRecord[];

    if (session.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: session.userId } });
      if (!patient) return NextResponse.json([]);

      appointments = await prisma.appointment.findMany({
        where: { patientId: patient.id },
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
    const { doctorId, dateTime, reason, clinicId, patientId } = body;

    if (!doctorId || !dateTime || !reason) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const scheduledAt = new Date(dateTime);
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: 'Invalid dateTime value' }, { status: 400 });
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    let patient: { id: string; clinicId: string | null } | null = null;

    if (session.role === 'PATIENT') {
      // Resolve the patient from the session (never trust a client-supplied patientId)
      patient = await prisma.patient.findUnique({ where: { userId: session.userId } });
      if (!patient) {
        return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 });
      }
    } else {
      // Staff booking for a walk-in/known patient within their own clinic.
      if (!sessionHasClinicAccess(session, clinicId || doctor.clinicId)) {
        return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
      }
      if (!patientId) {
        return NextResponse.json({ error: 'patientId is required for staff bookings' }, { status: 400 });
      }
      patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient || patient.clinicId === null || !sessionHasClinicAccess(session, patient.clinicId) || patient.clinicId !== doctor.clinicId) {
        return NextResponse.json({ error: 'Patient or doctor does not belong to your clinic' }, { status: 403 });
      }
    }

    const appt = await prisma.appointment.create({
      data: {
        clinicId: doctor.clinicId,
        patientId: patient.id,
        doctorId,
        dateTime: scheduledAt,
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

// Handles cancellation / check-in state transitions
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

    // Only transitions to a real AppointmentStatus are permitted; arbitrary
    // status strings (e.g. COMPLETED) are rejected to protect workflow integrity.
    const allowedStatuses = ['SCHEDULED', 'CHECKED_IN', 'CANCELLED', 'NO_SHOW'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid appointment status transition' }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Staff may only modify appointments in their own clinic.
    if (session.role !== 'PATIENT' && !sessionHasClinicAccess(session, appointment.clinicId)) {
      return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
    }

    // Patients may only cancel their own appointments; they may not set any
    // other workflow status (check-in / no-show are staff responsibilities).
    if (session.role === 'PATIENT') {
      if (status !== 'CANCELLED') {
        return NextResponse.json({ error: 'Patients may only cancel their appointments' }, { status: 403 });
      }
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