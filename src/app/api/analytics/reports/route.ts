import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/apiAuth';

export async function GET(request: Request) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    const reports = await prisma.report.findMany({
      where: clinicId ? { clinicId } : undefined,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(reports);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { name, type, clinicId, filters } = await request.json();

    if (!name || !type) {
      return NextResponse.json({ error: 'Missing report properties' }, { status: 400 });
    }

    const generatedBy = session.userId;

    const report = await prisma.report.create({
      data: {
        name,
        type,
        clinicId,
        filters: JSON.stringify(filters || {}),
        generatedBy
      }
    });

    // Write audit log entry
    await prisma.auditLog.create({
      data: {
        clinicId: clinicId || 'global-platform',
        userId: generatedBy,
        userRole: clinicId ? 'ADMIN' : 'SUPER_ADMIN',
        action: 'GENERATE_REPORT',
        details: `Compiled "${name}" report of type ${type}`,
      }
    });

    return NextResponse.json(report);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
