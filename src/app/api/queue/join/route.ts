import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/backend/errors/errorHandler';
import { RateLimiter } from '@/lib/backend/middleware/rateLimiter';
import { AppError } from '@/lib/backend/errors/AppError';
import { getSessionFromRequest } from '@/lib/session';
import { sessionHasClinicAccess } from '@/lib/apiAuth';

export const POST = withErrorHandler(async (request: Request) => {
  // 1. Enforce rate limiting on queue join actions (e.g. 5 calls per minute max from an IP)
  const clientIp = request.headers.get('x-forwarded-for') || 'anonymous_ip';
  RateLimiter.checkLimit(`rate_join_${clientIp}`, 5, 60000);

  const { clinicId, doctorId, name, age, gender, phone, reason, isEmergency } = await request.json();

  if (!clinicId || !doctorId || !name || !age || !phone) {
    throw new AppError('Missing registration details', 400);
  }

  // Input validation
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120) {
    throw new AppError('Name must be between 2 and 120 characters', 400);
  }
  const parsedAge = parseInt(age, 10);
  if (Number.isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150) {
    throw new AppError('Please provide a valid age', 400);
  }
  if (typeof phone !== 'string' || !/^[+\d][\d\s-]{7,19}$/.test(phone.trim())) {
    throw new AppError('Please provide a valid phone number', 400);
  }
  if (typeof clinicId !== 'string' || typeof doctorId !== 'string') {
    throw new AppError('Invalid clinic or doctor reference', 400);
  }

  // Resolve the session early: it controls both patient attribution and
  // whether an emergency flag is honored.
  const session = getSessionFromRequest(request);

  // 1. Find or create patient profile for phone number.
  // A logged-in PATIENT is always bound to their own profile row (by userId),
  // never to a phone-matched row owned by someone else. Anonymous joiners fall
  // back to phone-based find-or-create.
  let patient: { id: string; clinicId: string | null; name: string; email: string | null } | null = null;

  if (session && session.role === 'PATIENT') {
    patient = await prisma.patient.findUnique({ where: { userId: session.userId } });
    if (!patient) {
      throw new AppError('Patient profile not found. Please complete registration first.', 404);
    }
    if (patient.clinicId !== clinicId) {
      throw new AppError('You are not registered with this clinic', 403);
    }
  } else {
    patient = await prisma.patient.findFirst({
      where: { phone, clinicId },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          clinicId,
          name: name.trim(),
          phone: phone.trim(),
          age: parsedAge,
          gender: gender || 'Male',
          email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@temp-patient.com`,
        },
      });
    }
  }

  // 2. Find doctor
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }
  // Cross-clinic check: the doctor must belong to the clinic being joined.
  if (doctor.clinicId !== clinicId) {
    throw new AppError('Doctor does not belong to this clinic', 400);
  }

  // Emergency flag is only honored for authenticated staff of this clinic.
  // Anonymous self-flagging is ignored (prevents public queue-jumping).
  const staffAuthorized =
    !!session && session.role !== 'PATIENT' && sessionHasClinicAccess(session, clinicId);
  const isStaffEmergency = staffAuthorized && isEmergency === true;

  // 3. Count wait position
  const waitingCount = await prisma.queueToken.count({
    where: {
      doctorId,
      status: 'WAITING',
    },
  });

  const avgConsultTime = doctor.averageConsultationTime || 12;
  const waitTime = waitingCount * avgConsultTime;

  // 4. Generate token number initials e.g. Dr Jenkins -> JK-103
  const initials = doctor.name.split(' ').pop()?.substring(0, 2).toUpperCase() || 'TK';
  const totalCount = await prisma.queueToken.count({
    where: { doctorId },
  });
  const tokenNumber = `${initials}-${100 + totalCount + 1}`;

  // 5. Create Queue Token
  const token = await prisma.queueToken.create({
    data: {
      clinicId,
      patientId: patient.id,
      doctorId,
      tokenNumber,
      status: 'WAITING',
      estimatedWait: waitTime,
      reason: reason || 'General checkup',
      isEmergency: isStaffEmergency,
      priority: isStaffEmergency ? 1000 : 0,
    },
  });

  // Dispatch notification event
  try {
    const { NotificationEngine } = await import('@/lib/notificationEngine');
    await NotificationEngine.dispatchEvent('PATIENT_JOINED_QUEUE', {
      patientId: patient.id,
      patientName: name,
      patientEmail: patient.email || '',
      patientPhone: phone,
      tokenNumber,
      patientsAhead: waitingCount,
      estimatedWait: waitTime
    });
  } catch (err) {
    console.error('Error dispatching queue join notification event:', err);
  }

  // Track analytics event
  try {
    const { AnalyticsService } = await import('@/lib/analyticsService');
    await AnalyticsService.trackEvent(clinicId, 'PATIENT_JOINED', {
      patientId: patient.id,
      doctorId,
      tokenNumber,
      isEmergency: isStaffEmergency
    });
  } catch (err) {
    console.error('Error tracking analytics event:', err);
  }

  // Create session token payload
  const sessionId = `temp_pat_${crypto.randomUUID().slice(0, 12)}`;

  return NextResponse.json({
    success: true,
    data: {
      sessionId,
      tokenId: token.id,
      tokenNumber: token.tokenNumber,
      patientName: patient.name,
      doctorName: doctor.name,
      patientsAhead: waitingCount,
      estimatedWait: waitTime,
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  }, { status: 201 });
});
