import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/backend/errors/errorHandler';
import { ClinicService } from '@/lib/backend/services/ClinicService';
import { prisma } from '@/lib/prisma';
import { requireRole, sessionHasClinicAccess } from '@/lib/apiAuth';

export const GET = withErrorHandler(async (request: Request) => {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const { searchParams } = new URL(request.url);
  const clinicId = searchParams.get('clinicId');

  // Clinic admins may only read settings for their own clinic.
  if (!sessionHasClinicAccess(session, clinicId)) {
    return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
  }

  const settings = await ClinicService.getSettings(clinicId || '');

  return NextResponse.json({
    success: true,
    data: settings,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

export const POST = withErrorHandler(async (request: Request) => {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const {
    clinicId,
    queueEnabled,
    appointmentsEnabled,
    walkInPatients,
    emergencyQueue,
    tokenPrefix,
    maxDailyTokens,
    onlineQueueVisibility,
    publicProfileVisibility,
    notificationPreferences,
    timezone,
    language,
    maxQueueSize,
    slotDuration
  } = await request.json();

  if (!sessionHasClinicAccess(session, clinicId || '')) {
    return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
  }

  const updated = await ClinicService.updateSettings(clinicId || '', {
    queueEnabled,
    appointmentsEnabled,
    walkInPatients,
    emergencyQueue,
    tokenPrefix,
    maxDailyTokens,
    onlineQueueVisibility,
    publicProfileVisibility,
    notificationPreferences,
    timezone,
    language,
    maxQueueSize,
    slotDuration
  });

  // Write operational audit log
  await prisma.auditLog.create({
    data: {
      clinicId,
      userId: session.userId,
      userRole: session.role as 'ADMIN' | 'SUPER_ADMIN',
      action: 'UPDATE_CLINIC_SETTINGS',
      details: `Clinic settings updated. Timezone: ${timezone}, TokenPrefix: ${tokenPrefix}`,
    }
  });

  return NextResponse.json({
    success: true,
    data: updated,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});
