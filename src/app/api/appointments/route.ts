import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const clinicId = searchParams.get('clinicId') || 'clinic-1';

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    let appointments;

    if (role === 'PATIENT' && userId) {
      // Find patient record
      const patient = await prisma.patient.findUnique({ where: { userId } });
      if (!patient) return NextResponse.json([]);
      
      appointments = await prisma.appointment.findMany({
        where: { patientId: patient.id, clinicId },
        include: { doctor: true },
        orderBy: { dateTime: 'asc' },
      });
    } else if (role === 'DOCTOR' && userId) {
      // Find doctor record
      const doctor = await prisma.doctor.findUnique({ where: { userId } });
      if (!doctor) return NextResponse.json([]);

      appointments = await prisma.appointment.findMany({
        where: { doctorId: doctor.id, clinicId },
        include: { patient: true },
        orderBy: { dateTime: 'asc' },
      });
    } else {
      // Receptionist/Admin: Get all scheduled appointments
      appointments = await prisma.appointment.findMany({
        where: { clinicId },
        include: { patient: true, doctor: true },
        orderBy: { dateTime: 'asc' },
      });
    }

    // Format appointments to match frontend interface
    const formatted = appointments.map((appt: any) => ({
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
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, doctorId, dateTime, reason, clinicId } = body;

    if (!patientId || !doctorId || !dateTime || !reason) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Resolve patient
    let actualPatientId = patientId;
    if (patientId.startsWith('auth-')) {
      const patient = await prisma.patient.findUnique({ where: { userId: patientId } });
      if (patient) actualPatientId = patient.id;
    }

    const appt = await prisma.appointment.create({
      data: {
        clinicId: clinicId || 'clinic-1',
        patientId: actualPatientId,
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
      patientName: 'Self', // Will resolve on context load
      doctorId: appt.doctorId,
      doctorName: appt.doctor.name,
      dateTime: appt.dateTime.toISOString(),
      reason: appt.reasonForVisit,
      status: appt.status,
    });
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handles cancellation
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, status } = body;

    if (!appointmentId || !status) {
      return NextResponse.json({ error: 'Missing appointmentId or status' }, { status: 400 });
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
