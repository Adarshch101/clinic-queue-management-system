import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, sessionHasClinicAccess } from '@/lib/apiAuth';
import { readUploadFile } from '@/lib/fileStorage';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

/**
 * Serves medical-report bytes through an authenticated, authorization-checked
 * endpoint. RECEPTIONIST is excluded (front-desk must not receive report
 * bytes); patients may only open their own reports; other clinical staff may
 * open reports of patients in their own clinic only. File bytes are stored
 * privately in UploadThing and streamed back via a short-lived signed URL.
 */
export async function GET(request: Request) {
  const auth = requireRole(request, ['PATIENT', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json({ error: 'Missing reportId' }, { status: 400 });
    }

    const report = await prisma.medicalReport.findUnique({
      where: { id: reportId },
      include: { patient: true },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Fail-closed ownership/clinic scoping.
    if (session.role === 'PATIENT') {
      if (report.patient.userId !== session.userId) {
        return NextResponse.json({ error: 'You can only view your own reports' }, { status: 403 });
      }
    } else if (!sessionHasClinicAccess(session, report.patient.clinicId)) {
      return NextResponse.json({ error: 'You do not have access to this report' }, { status: 403 });
    }

    const file = await readUploadFile(report.fileUrl);
    if (!file) {
      return NextResponse.json({ error: 'Report file is missing' }, { status: 404 });
    }

    const ext = path.extname(report.fileName).replace('.', '').toLowerCase() || 'pdf';

    return new NextResponse(file.content, {
      status: 200,
      headers: {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(report.fileName)}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    console.error('Report file error:', error);
    return NextResponse.json({ error: 'Failed to read report file' }, { status: 500 });
  }
}