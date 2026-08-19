import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, sessionHasClinicAccess } from '@/lib/apiAuth';

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

    // Patients may only ever see their own tokens; the full clinic queue
    // (names, ages, genders, reasons) is staff-only and clinic-scoped.
    let tokens;
    if (session.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: session.userId } });
      if (!patient) return NextResponse.json([]);

      tokens = await prisma.queueToken.findMany({
        where: {
          patientId: patient.id,
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
    } else {
      if (!sessionHasClinicAccess(session, clinicId)) {
        return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
      }

      tokens = await prisma.queueToken.findMany({
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
    }

    const formatted = tokens.map((t) => ({
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
  } catch (error) {
    console.error('Error fetching queue tokens:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireRole(request, ['PATIENT', 'RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const session = auth.session;

  try {
    const body = await request.json();
    const { appointmentId, name, age, gender, phone, doctorId, reason, clinicId } = body;

    if (!clinicId) {
      return NextResponse.json({ error: 'clinicId is required' }, { status: 400 });
    }

    const activeClinicId = clinicId;

    // Clinic access enforcement: staff may only manage their own clinic,
    // and patients may only check in at their own clinic.
    if (session.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: session.userId } });
      if (!patient || patient.clinicId !== activeClinicId) {
        return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
      }
    } else if (!sessionHasClinicAccess(session, activeClinicId)) {
      return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
    }

    // Scenario 1: Check-in a booked appointment
    if (appointmentId) {
      const appt = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { patient: true, doctor: true },
      });

      if (!appt) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      }

      if (appt.clinicId !== activeClinicId) {
        return NextResponse.json({ error: 'Appointment does not belong to this clinic' }, { status: 403 });
      }

      // Patients may only check in their own appointments
      if (session.role === 'PATIENT') {
        const patient = await prisma.patient.findUnique({ where: { userId: session.userId } });
        if (!patient || patient.id !== appt.patientId) {
          return NextResponse.json({ error: 'You can only check in your own appointment' }, { status: 403 });
        }
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
    // Walk-in registration is a receptionist/operations function; a PATIENT
    // role may only ever check in their own booked appointment.
    if (session.role === 'PATIENT') {
      return NextResponse.json({ error: 'Only clinic staff can register walk-in patients' }, { status: 403 });
    }

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
    if (doctor.clinicId !== activeClinicId) {
      return NextResponse.json({ error: 'Doctor does not belong to this clinic' }, { status: 403 });
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
  } catch (error) {
    console.error('Error creating queue token:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
