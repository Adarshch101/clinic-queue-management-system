import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, sessionHasClinicAccess, type SessionPayload } from '@/lib/apiAuth';

// Which queue actions each role may perform. Clinical actions are reserved
// for DOCTOR/ADMIN; operations (reorder, transfer, cancel, emergency toggles)
// are restricted to reception/administration staff. Cross-checks against the
// session role before any mutation.
const ACTION_ROLE_MATRIX: Record<string, ('RECEPTIONIST' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN')[]> = {
  'call-next': ['RECEPTIONIST', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'],
  complete: ['DOCTOR', 'ADMIN', 'SUPER_ADMIN'],
  skip: ['RECEPTIONIST', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'],
  recall: ['RECEPTIONIST', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'],
  reorder: ['RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'],
  'toggle-emergency': ['RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'],
  'approve-emergency': ['RECEPTIONIST', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'],
  'pause-queue': ['RECEPTIONIST', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'],
  'resume-queue': ['RECEPTIONIST', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'],
  'add-delay': ['RECEPTIONIST', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'],
  'call-previous': ['RECEPTIONIST', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'],
  transfer: ['RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'],
  cancel: ['RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'],
};

export async function POST(request: Request) {
  const auth = requireRole(request, ['RECEPTIONIST', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const forbiddenClinic = () =>
    NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });

  // A staff member may only operate on tokens that belong to their own clinic.
  async function assertTokenAccess(session: SessionPayload, tokenId: string): Promise<NextResponse | null> {
    const token = await prisma.queueToken.findUnique({ where: { id: tokenId } });
    if (!token) return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    if (!sessionHasClinicAccess(session, token.clinicId)) return forbiddenClinic();
    return null;
  }

  // A staff member may only operate on doctors that belong to their own clinic.
  async function assertDoctorAccess(session: SessionPayload, doctorId: string): Promise<NextResponse | null> {
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    if (!sessionHasClinicAccess(session, doctor.clinicId)) return forbiddenClinic();
    return null;
  }

  try {
    const body = await request.json();
    const { 
      action, 
      doctorId, 
      tokenId, 
      direction, 
      diagnosis, 
      prescription, 
      notes, 
      mins, 
      isEmergency 
    } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action parameter is required' }, { status: 400 });
    }

    // Enforce the per-action role matrix before touching any data.
    const allowedRoles = ACTION_ROLE_MATRIX[action];
    if (!allowedRoles) {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }
    if (!allowedRoles.includes(session.role as 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'You do not have permission to perform this action' },
        { status: 403 }
      );
    }

    // --- Action 1: Call Next Patient ---
    if (action === 'call-next') {
      if (!doctorId) return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 });

      const doctorDenied = await assertDoctorAccess(session, doctorId);
      if (doctorDenied) return doctorDenied;

      // 1. Mark any active called/consultation token for this doctor as COMPLETED
      await prisma.queueToken.updateMany({
        where: {
          doctorId,
          status: { in: ['CALLED', 'IN_CONSULTATION'] },
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // 2. Fetch the next highest priority WAITING token
      const nextToken = await prisma.queueToken.findFirst({
        where: { doctorId, status: 'WAITING' },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }, // FIFO tie-breaker
        ],
      });

      if (!nextToken) {
        return NextResponse.json({ success: true, calledToken: null });
      }

      // 3. Mark next token as CALLED
      const updated = await prisma.queueToken.update({
        where: { id: nextToken.id },
        data: {
          status: 'CALLED',
          calledAt: new Date(),
          startedAt: new Date(),
        },
        include: { patient: true },
      });

      // 4. Recalculate remaining wait times for remaining waiting patients
      const waitingTokens = await prisma.queueToken.findMany({
        where: { doctorId, status: 'WAITING' },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
      });

      const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
      const avgTime = doctor?.averageConsultationTime || 12;

      for (let i = 0; i < waitingTokens.length; i++) {
        await prisma.queueToken.update({
          where: { id: waitingTokens[i].id },
          data: { estimatedWait: (i + 1) * avgTime },
        });
      }

      // Track analytics event
      try {
        const { AnalyticsService } = await import('@/lib/analyticsService');
        await AnalyticsService.trackEvent(updated.clinicId, 'PATIENT_CALLED', {
          tokenId: updated.id,
          doctorId: updated.doctorId,
          tokenNumber: updated.tokenNumber
        });
      } catch (err) {
        console.error('Error tracking analytics event:', err);
      }

      return NextResponse.json({ success: true, calledToken: updated });
    }

    // --- Action 2: Complete Consultation & Log Visit ---
    if (action === 'complete') {
      if (!tokenId) return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });

      const tokenDenied = await assertTokenAccess(session, tokenId);
      if (tokenDenied) return tokenDenied;

      const token = await prisma.queueToken.findUnique({
        where: { id: tokenId },
        include: { doctor: true },
      });

      if (!token) return NextResponse.json({ error: 'Token not found' }, { status: 404 });

      // 1. Mark token as completed
      await prisma.queueToken.update({
        where: { id: tokenId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // 2. Create the visit record
      const prescriptionsText = prescription || 'General health advice';
      await prisma.visit.create({
        data: {
          patientId: token.patientId,
          doctorId: token.doctorId,
          diagnosis: diagnosis || 'General checkup completed',
          prescriptions: prescriptionsText,
          notes: notes || '',
        },
      });

      // 3. Trigger auto-call next patient for this doctor
      const nextCalledToken = await callNextDoctorToken(token.doctorId);

      // Track analytics event
      try {
        const { AnalyticsService } = await import('@/lib/analyticsService');
        await AnalyticsService.trackEvent(token.clinicId, 'VISIT_COMPLETED', {
          tokenId: token.id,
          doctorId: token.doctorId,
          patientId: token.patientId
        });
      } catch (err) {
        console.error('Error tracking analytics event:', err);
      }

      return NextResponse.json({ success: true, nextCalledToken });
    }

    // --- Action 3: Skip Patient ---
    if (action === 'skip') {
      if (!tokenId) return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });

      const tokenDenied = await assertTokenAccess(session, tokenId);
      if (tokenDenied) return tokenDenied;

      const updated = await prisma.queueToken.update({
        where: { id: tokenId },
        data: { status: 'SKIPPED' },
      });

      return NextResponse.json(updated);
    }

    // --- Action 4: Recall Patient ---
    if (action === 'recall') {
      if (!tokenId) return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });

      const tokenDenied = await assertTokenAccess(session, tokenId);
      if (tokenDenied) return tokenDenied;

      const updated = await prisma.queueToken.update({
        where: { id: tokenId },
        data: {
          status: 'CALLED',
          calledAt: new Date(),
        },
      });

      return NextResponse.json(updated);
    }

    // --- Action 5: Reorder Queue (Priority adjustment) ---
    if (action === 'reorder') {
      if (!tokenId || !direction) {
        return NextResponse.json({ error: 'Missing tokenId or direction' }, { status: 400 });
      }

      const tokenDenied = await assertTokenAccess(session, tokenId);
      if (tokenDenied) return tokenDenied;

      const token = await prisma.queueToken.findUnique({ where: { id: tokenId } });
      if (!token) return NextResponse.json({ error: 'Token not found' }, { status: 404 });

      const currentPriority = token.priority || 0;
      const newPriority = direction === 'up' ? currentPriority + 1 : Math.max(0, currentPriority - 1);

      const updated = await prisma.queueToken.update({
        where: { id: tokenId },
        data: { priority: newPriority },
      });

      return NextResponse.json(updated);
    }

    // --- Action 6: Toggle Emergency Flag ---
    if (action === 'toggle-emergency') {
      if (!tokenId) return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });

      const tokenDenied = await assertTokenAccess(session, tokenId);
      if (tokenDenied) return tokenDenied;

      const updated = await prisma.queueToken.update({
        where: { id: tokenId },
        data: {
          isEmergency: isEmergency,
          priority: isEmergency ? 999 : 0,
          estimatedWait: isEmergency ? 0 : 30,
        },
      });

      return NextResponse.json(updated);
    }

    // --- Action 7: Approve Emergency ---
    if (action === 'approve-emergency') {
      if (!tokenId) return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });

      const tokenDenied = await assertTokenAccess(session, tokenId);
      if (tokenDenied) return tokenDenied;

      // Elevate priority index to 1000 so they are placed next in line
      const updated = await prisma.queueToken.update({
        where: { id: tokenId },
        data: {
          status: 'WAITING',
          priority: 1000,
          estimatedWait: 0,
        },
      });

      return NextResponse.json(updated);
    }

    // --- Action 8: Pause / Resume Queue ---
    if (action === 'pause-queue' || action === 'resume-queue') {
      if (!doctorId) return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 });

      const doctorDenied = await assertDoctorAccess(session, doctorId);
      if (doctorDenied) return doctorDenied;

      const isActive = action === 'resume-queue' ? 'true' : 'false';
      const updated = await prisma.doctor.update({
        where: { id: doctorId },
        data: { isActive },
      });

      return NextResponse.json(updated);
    }

    // --- Action 9: Add delay ---
    if (action === 'add-delay') {
      if (!doctorId || !mins) {
        return NextResponse.json({ error: 'Missing doctorId or mins delay value' }, { status: 400 });
      }

      const delayMins = Number.parseInt(mins, 10);
      if (Number.isNaN(delayMins) || delayMins < 0 || delayMins > 240) {
        return NextResponse.json({ error: 'Delay must be a number between 0 and 240 minutes' }, { status: 400 });
      }

      const doctorDenied = await assertDoctorAccess(session, doctorId);
      if (doctorDenied) return doctorDenied;

      // Find all WAITING tokens for this doctor
      const waitingTokens = await prisma.queueToken.findMany({
        where: { doctorId, status: 'WAITING' },
      });

      for (const t of waitingTokens) {
        await prisma.queueToken.update({
          where: { id: t.id },
          data: { estimatedWait: t.estimatedWait + delayMins },
        });
      }

      return NextResponse.json({ success: true });
    }

    // --- Action 10: Call Previous Patient ---
    if (action === 'call-previous') {
      if (!doctorId) return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 });

      const doctorDenied = await assertDoctorAccess(session, doctorId);
      if (doctorDenied) return doctorDenied;

      // 1. Find the current active token (CALLED or IN_CONSULTATION)
      const currentActive = await prisma.queueToken.findFirst({
        where: {
          doctorId,
          status: { in: ['CALLED', 'IN_CONSULTATION'] },
        },
      });

      // 2. Find the last completed or skipped token for this doctor
      const previousToken = await prisma.queueToken.findFirst({
        where: {
          doctorId,
          status: { in: ['COMPLETED', 'SKIPPED'] },
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (!previousToken) {
        return NextResponse.json({ error: 'No previous patient token found in logs' }, { status: 404 });
      }

      // 3. Put current active back to WAITING (at the front of the queue)
      if (currentActive) {
        await prisma.queueToken.update({
          where: { id: currentActive.id },
          data: {
            status: 'WAITING',
            priority: 900, // keep at the front of the line
          },
        });
      }

      // 4. Restore previous token to CALLED status
      const restored = await prisma.queueToken.update({
        where: { id: previousToken.id },
        data: {
          status: 'CALLED',
          completedAt: null,
        },
      });

      // Log Queue Event
      await prisma.queueEvent.create({
        data: {
          clinicId: restored.clinicId,
          eventType: 'RECALLED',
          tokenId: restored.id,
          payload: JSON.stringify({ restoredTokenId: restored.id, demotedTokenId: currentActive?.id }),
        },
      });

      return NextResponse.json({ success: true, calledToken: restored });
    }

    // --- Action 11: Transfer Patient to another Doctor ---
    if (action === 'transfer') {
      const { targetDoctorId } = body;
      if (!tokenId || !targetDoctorId) {
        return NextResponse.json({ error: 'Missing tokenId or targetDoctorId' }, { status: 400 });
      }

      const tokenDenied = await assertTokenAccess(session, tokenId);
      if (tokenDenied) return tokenDenied;

      const targetDenied = await assertDoctorAccess(session, targetDoctorId);
      if (targetDenied) return targetDenied;

      const token = await prisma.queueToken.findUnique({
        where: { id: tokenId },
        include: { doctor: true },
      });

      if (!token) return NextResponse.json({ error: 'Token not found' }, { status: 404 });

      // Update token's doctor ID and calculate new wait time
      const targetDoctor = await prisma.doctor.findUnique({ where: { id: targetDoctorId } });
      if (!targetDoctor) return NextResponse.json({ error: 'Target doctor not found' }, { status: 404 });

      const activeCount = await prisma.queueToken.count({
        where: {
          doctorId: targetDoctorId,
          status: 'WAITING',
        },
      });

      const newEstimatedWait = activeCount * (targetDoctor.averageConsultationTime || 12);

      const updated = await prisma.queueToken.update({
        where: { id: tokenId },
        data: {
          doctorId: targetDoctorId,
          estimatedWait: newEstimatedWait,
          status: 'WAITING', // put back in waiting list for the new doctor
        },
      });

      // Log transfer history
      await prisma.queueTransferHistory.create({
        data: {
          tokenId,
          fromDoctorId: token.doctorId,
          toDoctorId: targetDoctorId,
          performedBy: session.userId,
        },
      });

      // Log Event
      await prisma.queueEvent.create({
        data: {
          clinicId: token.clinicId,
          eventType: 'TRANSFERRED',
          tokenId,
          payload: JSON.stringify({ fromDoctorId: token.doctorId, toDoctorId: targetDoctorId }),
        },
      });

      // Log Audit Log
      await prisma.auditLog.create({
        data: {
          clinicId: token.clinicId,
          userId: session.userId,
          userRole: session.role as 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN',
          action: 'TRANSFER_PATIENT',
          details: `Patient token ${token.tokenNumber} transferred from Dr ${token.doctor.name} to Dr ${targetDoctor.name}`,
        },
      });

      return NextResponse.json(updated);
    }

    // --- Action 12: Cancel Patient Token ---
    if (action === 'cancel') {
      if (!tokenId) return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });

      const tokenDenied = await assertTokenAccess(session, tokenId);
      if (tokenDenied) return tokenDenied;

      const token = await prisma.queueToken.findUnique({ where: { id: tokenId } });
      if (!token) return NextResponse.json({ error: 'Token not found' }, { status: 404 });

      const updated = await prisma.queueToken.update({
        where: { id: tokenId },
        data: {
          status: 'CANCELLED',
        },
      });

      // Log Event
      await prisma.queueEvent.create({
        data: {
          clinicId: token.clinicId,
          eventType: 'CANCELLED',
          tokenId,
          payload: JSON.stringify({ reason: 'Cancelled by staff / patient' }),
        },
      });

      // Log Audit Log
      await prisma.auditLog.create({
        data: {
          clinicId: token.clinicId,
          userId: session.userId,
          userRole: session.role as 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN',
          action: 'CANCEL_QUEUE_TOKEN',
          details: `Token: ${token.tokenNumber} was cancelled by staff`,
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    console.error('Error executing queue action:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// Helper method to call the next patient
async function callNextDoctorToken(doctorId: string) {
  // Mark active as completed
  await prisma.queueToken.updateMany({
    where: {
      doctorId,
      status: { in: ['CALLED', 'IN_CONSULTATION'] },
    },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  // Find next waiting
  const nextToken = await prisma.queueToken.findFirst({
    where: { doctorId, status: 'WAITING' },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' },
    ],
  });

  if (!nextToken) return null;

  // Mark as CALLED
  const updated = await prisma.queueToken.update({
    where: { id: nextToken.id },
    data: {
      status: 'CALLED',
      calledAt: new Date(),
      startedAt: new Date(),
    },
    include: { patient: true },
  });

  // Recalculate remaining wait times
  const waitingTokens = await prisma.queueToken.findMany({
    where: { doctorId, status: 'WAITING' },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' },
    ],
  });

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  const avgTime = doctor?.averageConsultationTime || 12;

  for (let i = 0; i < waitingTokens.length; i++) {
    await prisma.queueToken.update({
      where: { id: waitingTokens[i].id },
      data: { estimatedWait: (i + 1) * avgTime },
    });
  }

  return updated;
}
