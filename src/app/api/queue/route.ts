import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId') || 'clinic-1';

    const tokens = await prisma.queueToken.findMany({
      where: {
        clinicId,
        status: {
          in: ['WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED'],
        },
      },
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const formatted = tokens.map((t: any) => ({
      id: t.id,
      clinicId: t.clinicId,
      patientId: t.patientId,
      patientName: t.patient.name,
      patientAge: t.patient.age,
      patientGender: t.patient.gender,
      doctorId: t.doctorId,
      tokenNumber: t.tokenNumber,
      status: t.status,
      isEmergency: t.isEmergency,
      priority: t.priority,
      estimatedWait: t.estimatedWait,
      reason: t.reason,
      calledAt: t.calledAt?.toISOString(),
      startedAt: t.startedAt?.toISOString(),
      completedAt: t.completedAt?.toISOString(),
      appointmentId: t.appointmentId,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching queue tokens:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, name, age, gender, phone, doctorId, reason, clinicId } = body;

    const activeClinicId = clinicId || 'clinic-1';

    // Scenario 1: Check-in a booked appointment
    if (appointmentId) {
      const appt = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { patient: true, doctor: true },
      });

      if (!appt) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      }

      // Update appointment status
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CHECKED_IN' },
      });

      // Calculate token wait estimates based on existing active tokens for this doctor
      const activeTokensCount = await prisma.queueToken.count({
        where: {
          doctorId: appt.doctorId,
          status: { in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] },
        },
      });

      const avgConsultTime = appt.doctor.averageConsultationTime || 12;
      const waitTime = activeTokensCount * avgConsultTime;

      // Token code e.g. Dr Sarah Jenkins -> JK-103
      const initials = appt.doctor.name.split(' ').pop()?.substring(0, 2).toUpperCase() || 'TK';
      const totalTokensCount = await prisma.queueToken.count({
        where: { doctorId: appt.doctorId },
      });
      const tokenNumber = `${initials}-${100 + totalTokensCount + 1}`;

      const token = await prisma.queueToken.create({
        data: {
          clinicId: activeClinicId,
          appointmentId,
          patientId: appt.patientId,
          doctorId: appt.doctorId,
          tokenNumber,
          status: 'WAITING',
          estimatedWait: waitTime,
          reason: appt.reasonForVisit,
          priority: 0,
        },
        include: {
          patient: true,
        },
      });

      return NextResponse.json({
        id: token.id,
        clinicId: token.clinicId,
        patientId: token.patientId,
        patientName: token.patient.name,
        patientAge: token.patient.age,
        patientGender: token.patient.gender,
        doctorId: token.doctorId,
        tokenNumber: token.tokenNumber,
        status: token.status,
        isEmergency: token.isEmergency,
        priority: token.priority,
        estimatedWait: token.estimatedWait,
        reason: token.reason,
        appointmentId: token.appointmentId,
      });
    }

    // Scenario 2: Register a walk-in patient
    if (!name || !age || !phone || !doctorId || !reason) {
      return NextResponse.json({ error: 'Missing walk-in details' }, { status: 400 });
    }

    // Find or create patient profile for phone number
    let patient = await prisma.patient.findFirst({
      where: { phone, clinicId: activeClinicId },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          clinicId: activeClinicId,
          name,
          phone,
          age: parseInt(age),
          gender: gender || 'Male',
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        },
      });
    }

    // Find doctor
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Calculate wait times
    const activeTokensCount = await prisma.queueToken.count({
      where: {
        doctorId,
        status: { in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] },
      },
    });
    const avgConsultTime = doctor.averageConsultationTime || 12;
    const waitTime = activeTokensCount * avgConsultTime;

    const initials = doctor.name.split(' ').pop()?.substring(0, 2).toUpperCase() || 'TK';
    const totalTokensCount = await prisma.queueToken.count({
      where: { doctorId },
    });
    const tokenNumber = `${initials}-${100 + totalTokensCount + 1}`;

    const token = await prisma.queueToken.create({
      data: {
        clinicId: activeClinicId,
        patientId: patient.id,
        doctorId,
        tokenNumber,
        status: 'WAITING',
        estimatedWait: waitTime,
        reason,
        priority: 0,
      },
      include: {
        patient: true,
      },
    });

    return NextResponse.json({
      id: token.id,
      clinicId: token.clinicId,
      patientId: token.patientId,
      patientName: token.patient.name,
      patientAge: token.patient.age,
      patientGender: token.patient.gender,
      doctorId: token.doctorId,
      tokenNumber: token.tokenNumber,
      status: token.status,
      isEmergency: token.isEmergency,
      priority: token.priority,
      estimatedWait: token.estimatedWait,
      reason: token.reason,
      appointmentId: token.appointmentId,
    });
  } catch (error: any) {
    console.error('Error creating queue token:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
