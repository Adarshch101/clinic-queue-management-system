import { NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/analyticsService';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/apiAuth';

export async function GET(request: Request) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    const dateRange = searchParams.get('dateRange') || '7d';

    // 1. Audit Log: Log that analytics were viewed
    await prisma.auditLog.create({
      data: {
        clinicId: clinicId || 'global-platform',
        userId: session.userId,
        userRole: clinicId ? 'ADMIN' : 'SUPER_ADMIN',
        action: 'VIEW_ANALYTICS',
        details: `Analytics dashboard loaded for range: ${dateRange}`,
      }
    });

    const stats = await AnalyticsService.getDashboardAnalytics(clinicId, dateRange);
    return NextResponse.json(stats);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
