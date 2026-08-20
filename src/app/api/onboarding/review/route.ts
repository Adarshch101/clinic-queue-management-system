import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, sessionHasClinicAccess } from '@/lib/apiAuth';
import { NotificationEngine } from '@/lib/notificationEngine';

const VALID_ACTIONS = new Set(['SUBMIT', 'APPROVE', 'REJECT']);

export async function POST(request: Request) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { clinicId, action, reason, notes } = await request.json();

    if (!clinicId || !action) {
      return NextResponse.json({ error: 'Missing clinicId or action' }, { status: 400 });
    }

    if (!VALID_ACTIONS.has(action)) {
      return NextResponse.json({ error: 'Unknown review action' }, { status: 400 });
    }

    // Admins may only SUBMIT their own clinic; approval decisions are SUPER_ADMIN-only
    if (action === 'SUBMIT') {
      if (!sessionHasClinicAccess(session, clinicId)) {
        return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
      }
    } else if (session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only the platform administrator can approve or reject clinics' }, { status: 403 });
    }

    const performedBy = session.userId;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Resolve target status based on action
      let targetStatus = 'PENDING';
      let requestStatus = 'PENDING_REVIEW';

      if (action === 'SUBMIT') {
        targetStatus = 'PENDING';
        requestStatus = 'PENDING_REVIEW';
      } else if (action === 'APPROVE') {
        targetStatus = 'VERIFIED';
        requestStatus = 'APPROVED';
      } else if (action === 'REJECT') {
        targetStatus = 'REJECTED';
        requestStatus = 'REJECTED';
      }

      // 2. Update Clinic status
      const clinic = await tx.clinic.update({
        where: { id: clinicId },
        data: { status: targetStatus },
      });

      // 3. Create or update Verification Request
      const verRequest = await tx.verificationRequest.create({
        data: {
          clinicId,
          status: requestStatus,
          rejectionReason: reason || null,
          notes: notes || null,
        },
      });

      // 4. Log to history list
      await tx.verificationHistory.create({
        data: {
          requestId: verRequest.id,
          action,
          performedBy,
          performedByRole: action === 'SUBMIT' ? 'ADMIN' : 'SUPER_ADMIN',
          notes: notes || reason || 'Verification state transition',
        },
      });

      // Write audit log entry
      await tx.auditLog.create({
        data: {
          clinicId,
          userId: performedBy,
          userRole: action === 'SUBMIT' ? 'ADMIN' : 'SUPER_ADMIN',
          action: `VERIFICATION_${action}`,
          details: `Clinic "${clinic.name}" verification request status updated to ${requestStatus}`,
        },
      });

      // Dispatch notification event
      try {
        if (action === 'APPROVE') {
          await NotificationEngine.dispatchEvent('CLINIC_APPROVED', {
            ownerId: clinic.ownerName || 'owner',
            email: clinic.email || '',
            clinicName: clinic.name,
          });
        } else if (action === 'REJECT') {
          await NotificationEngine.dispatchEvent('CLINIC_REJECTED', {
            ownerId: clinic.ownerName || 'owner',
            email: clinic.email || '',
            reason: reason || 'Verification document discrepancy',
          });
        }
      } catch (err) {
        console.error('Error dispatching verification notification event:', err);
      }

      return { clinic, requestStatus };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('API review error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}