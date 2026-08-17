import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, sessionHasClinicAccess, type SessionPayload } from '@/lib/apiAuth';

export async function POST(request: Request) {
  try {
    const { tokenId } = await request.json();

    if (!tokenId) {
      return NextResponse.json({ error: 'Missing tokenId' }, { status: 400 });
    }

    const token = await prisma.queueToken.findUnique({
      where: { id: tokenId },
    });

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Staff can cancel any token in their own clinic; a patient can only cancel their own.
    let actingUserId = 'anonymous-patient';
    let actingRole: string = 'PATIENT';

    const staffAuth = requireRole(request, ['RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN']);
    if (staffAuth instanceof NextResponse) {
      const patientAuth = requireAuth(request);
      if (patientAuth instanceof NextResponse) return patientAuth;
      const patient = await prisma.patient.findUnique({ where: { userId: patientAuth.session.userId } });
      if (!patient || patient.id !== token.patientId) {
        return NextResponse.json({ error: 'You can only cancel your own token' }, { status: 403 });
      }
    } else {
      const staffSession: SessionPayload = staffAuth.session;
      if (!sessionHasClinicAccess(staffSession, token.clinicId)) {
        return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
      }
      actingUserId = staffSession.userId;
      actingRole = staffSession.role;
    }

    // Update status to CANCELLED
    const updated = await prisma.queueToken.update({
      where: { id: tokenId },
      data: {
        status: 'CANCELLED',
      },
    });

    // Write audit log entry
    await prisma.auditLog.create({
      data: {
        clinicId: token.clinicId,
        userId: actingUserId,
        userRole: actingRole as 'PATIENT' | 'RECEPTIONIST' | 'ADMIN' | 'SUPER_ADMIN',
        action: 'CANCEL_QUEUE',
        details: `Token: ${token.tokenNumber} was cancelled`,
      },
    });

    return NextResponse.json({ success: true, token: updated });
  } catch (error) {
    console.error('API cancel queue error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
