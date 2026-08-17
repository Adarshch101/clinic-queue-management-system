import { NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/analyticsService';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/apiAuth';

export async function POST(request: Request) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { type, clinicId, doctorId, dateRange } = await request.json();

    if (!type) {
      return NextResponse.json({ error: 'Missing type parameter' }, { status: 400 });
    }

    const generatedBy = session.userId;

    const csvContent = await AnalyticsService.compileCSVReport({
      type,
      clinicId,
      doctorId,
      dateRange
    });

    // Write operational audit log
    await prisma.auditLog.create({
      data: {
        clinicId: clinicId || 'global-platform',
        userId: generatedBy,
        userRole: clinicId ? 'ADMIN' : 'SUPER_ADMIN',
        action: 'EXPORT_REPORT',
        details: `Exported ${type} analytics report to CSV format`,
      }
    });

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${type.toLowerCase()}_report_${Date.now()}.csv"`,
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
