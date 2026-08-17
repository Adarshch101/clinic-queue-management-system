import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/apiAuth';

export async function POST(request: Request) {
  const auth = requireRole(request, ['SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    const resolvedAdminId = session.userId;

    // --- Action 1: Toggle Feature Flags ---
    if (action === 'toggle-flag') {
      const { flagName, isEnabled } = body;
      const updated = await prisma.featureFlag.update({
        where: { name: flagName },
        data: { isEnabled },
      });
      // Audit log
      await prisma.auditLog.create({
        data: {
          clinicId: 'global',
          userId: resolvedAdminId,
          userRole: 'SUPER_ADMIN',
          action: 'TOGGLE_FEATURE_FLAG',
          details: `Feature flag ${flagName} set to ${isEnabled}`,
        },
      });
      return NextResponse.json(updated);
    }

    // --- Action 2: Toggle Maintenance Mode ---
    if (action === 'maintenance') {
      const { isEnabled, settingsId } = body;
      const updated = await prisma.platformSettings.update({
        where: { id: settingsId },
        data: { maintenance: isEnabled },
      });
      // Audit log
      await prisma.auditLog.create({
        data: {
          clinicId: 'global',
          userId: resolvedAdminId,
          userRole: 'SUPER_ADMIN',
          action: 'TOGGLE_MAINTENANCE_MODE',
          details: `Platform maintenance mode set to ${isEnabled}`,
        },
      });
      return NextResponse.json(updated);
    }

    // --- Action 3: Save Platform Settings ---
    if (action === 'platform-settings') {
      const { settingsId, platformName, brandingColor, supportEmail, supportPhone } = body;
      const updated = await prisma.platformSettings.update({
        where: { id: settingsId },
        data: {
          platformName,
          brandingColor,
          supportEmail,
          supportPhone,
        },
      });
      return NextResponse.json(updated);
    }

    // --- Action 4: Clinic Status Transition (Suspend, Reactivate, Reject, Approve) ---
    if (action === 'clinic-status') {
      const { clinicId, status, notes } = body;
      const updated = await prisma.clinic.update({
        where: { id: clinicId },
        data: { status },
      });

      // If status matches a verification review step, log to verification requests
      const requestRecord = await prisma.verificationRequest.findFirst({
        where: { clinicId },
        orderBy: { submittedAt: 'desc' },
      });

      if (requestRecord) {
        await prisma.verificationHistory.create({
          data: {
            requestId: requestRecord.id,
            action: status === 'VERIFIED' ? 'APPROVE' : status === 'REJECTED' ? 'REJECT' : 'REQUEST_CHANGES',
            performedBy: resolvedAdminId,
            performedByRole: 'SUPER_ADMIN',
            notes: notes || `Clinic status updated to ${status}`,
          },
        });
      }

      // Audit Log
      await prisma.auditLog.create({
        data: {
          clinicId,
          userId: resolvedAdminId,
          userRole: 'SUPER_ADMIN',
          action: `CLINIC_${status}`,
          details: `Clinic ${updated.name} verification status set to ${status}`,
        },
      });

      return NextResponse.json(updated);
    }

    // --- Action 5: Create Announcements ---
    if (action === 'announcement') {
      const { title, content, target, status } = body;
      const updated = await prisma.announcement.create({
        data: {
          title,
          content,
          target: target || 'ALL',
          status: status || 'PUBLISHED',
        },
      });
      // Audit log
      await prisma.auditLog.create({
        data: {
          clinicId: 'global',
          userId: resolvedAdminId,
          userRole: 'SUPER_ADMIN',
          action: 'PUBLISH_ANNOUNCEMENT',
          details: `Announcement published: "${title}"`,
        },
      });
      return NextResponse.json(updated);
    }

    // --- Action 6: Delete Clinic ---
    if (action === 'delete-clinic') {
      const { clinicId } = body;
      await prisma.clinic.delete({
        where: { id: clinicId },
      });
      // Audit log
      await prisma.auditLog.create({
        data: {
          clinicId: 'global',
          userId: resolvedAdminId,
          userRole: 'SUPER_ADMIN',
          action: 'DELETE_CLINIC',
          details: `Clinic deleted permanently: ID ${clinicId}`,
        },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('API Super Admin Action error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
