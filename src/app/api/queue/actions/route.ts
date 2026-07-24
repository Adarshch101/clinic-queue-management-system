import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
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

    // --- Action 1: Call Next Patient ---
    if (action === 'call-next') {
      if (!doctorId) return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 });

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

      return NextResponse.json({ success: true, calledToken: updated });
    }

    // --- Action 2: Complete Consultation & Log Visit ---
    if (action === 'complete') {
      if (!tokenId) return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });

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

      return NextResponse.json({ success: true, nextCalledToken });
    }

    // --- Action 3: Skip Patient ---
    if (action === 'skip') {
      if (!tokenId) return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });

      const updated = await prisma.queueToken.update({
        where: { id: tokenId },
        data: { status: 'SKIPPED' },
      });

      return NextResponse.json(updated);
    }

    // --- Action 4: Recall Patient ---
    if (action === 'recall') {
      if (!tokenId) return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });

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

      // Find all WAITING tokens for this doctor
      const waitingTokens = await prisma.queueToken.findMany({
        where: { doctorId, status: 'WAITING' },
      });

      for (const t of waitingTokens) {
        await prisma.queueToken.update({
          where: { id: t.id },
          data: { estimatedWait: t.estimatedWait + parseInt(mins) },
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error executing queue action:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
