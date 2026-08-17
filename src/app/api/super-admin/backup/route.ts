import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/apiAuth';
import { createDatabaseBackup, humanReadableSize } from '@/lib/backupService';

export async function GET(request: Request) {
  const auth = requireRole(request, ['SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  try {
    const backups = await prisma.backupJob.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(backups);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireRole(request, ['SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  const userId = session.userId;

  try {
    // Generate a real SQL dump of all tables
    const { filename, fileUrl, size } = await createDatabaseBackup();

    const job = await prisma.backupJob.create({
      data: {
        filename,
        size,
        status: 'COMPLETED'
      }
    });

    // Write audit log entry
    await prisma.auditLog.create({
      data: {
        clinicId: 'global-platform',
        userId,
        userRole: 'SUPER_ADMIN',
        action: 'TRIGGER_BACKUP',
        details: `Manual database backup triggered successfully. File: ${filename} (${humanReadableSize(size)})`,
      }
    });

    return NextResponse.json({ ...job, fileUrl }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}