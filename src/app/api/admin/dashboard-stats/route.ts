import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, sessionHasClinicAccess } from '@/lib/apiAuth';
import { formatDocumentDtos } from '@/lib/dtoHelpers';

export async function GET(request: Request) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json({ error: 'Missing clinicId' }, { status: 400 });
    }

    if (!sessionHasClinicAccess(session, clinicId)) {
      return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
    }

    // 1. Fetch Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalTokensCount = await prisma.queueToken.count({
      where: { clinicId, createdAt: { gte: today } },
    });

    const waitingCount = await prisma.queueToken.count({
      where: { clinicId, status: 'WAITING', createdAt: { gte: today } },
    });

    const completedCount = await prisma.queueToken.count({
      where: { clinicId, status: 'COMPLETED', createdAt: { gte: today } },
    });

    const cancelledCount = await prisma.queueToken.count({
      where: { clinicId, status: 'CANCELLED', createdAt: { gte: today } },
    });

    // Fetch clinic settings for slot duration
    const clinicSettings = await prisma.clinicSettings.findUnique({
      where: { clinicId },
    });
    const avgConsultMinutes = clinicSettings?.slotDuration || 12;

    // 2. Fetch staff roster
    const admins = await prisma.clinicAdmin.findMany({ where: { clinicId } });
    const receptionists = await prisma.receptionist.findMany({ where: { clinicId } });
    const doctors = await prisma.doctor.findMany({ where: { clinicId } });

    const role = session.role;

    // 3. Fetch recent audit logs (restricted to SUPER_ADMIN)
    let logs: Awaited<ReturnType<typeof prisma.auditLog.findMany>> = [];
    if (role === 'SUPER_ADMIN') {
      logs = await prisma.auditLog.findMany({
        where: { clinicId },
        orderBy: { createdAt: 'desc' },
        take: 6,
      });
    }

    // 4. Fetch verification documents
    const documents = await prisma.clinicDocument.findMany({
      where: { clinicId },
    });

    const documentDtos = formatDocumentDtos(documents);

    return NextResponse.json({
      stats: {
        totalPatients: totalTokensCount,
        waitingCount,
        completedCount,
        cancelledCount,
        averageWaitTime: waitingCount * avgConsultMinutes,
        averageConsultTime: avgConsultMinutes,
      },
      staff: {
        admins,
        receptionists,
        doctors,
      },
      recentActivity: logs,
      documents: documentDtos,
    });
  } catch (error: unknown) {
    console.error('API Fetch dashboard stats error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

