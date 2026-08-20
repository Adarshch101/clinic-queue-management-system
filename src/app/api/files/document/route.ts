import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, sessionHasClinicAccess } from '@/lib/apiAuth';
import { resolveUploadPath } from '@/lib/fileStorage';
import { readFile } from 'fs/promises';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

/**
 * Serves clinic verification-document bytes through an authenticated,
 * clinic-scoped endpoint. Only ADMINs and SUPER_ADMIN may open documents,
 * and an ADMIN may only open documents of their own clinic.
 */
export async function GET(request: Request) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });
    }

    const doc = await prisma.clinicDocument.findUnique({ where: { id: documentId } });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Fail-closed: the document must belong to a clinic the caller can access.
    if (!sessionHasClinicAccess(session, doc.clinicId)) {
      return NextResponse.json({ error: 'You do not have access to this document' }, { status: 403 });
    }

    const absPath = await resolveUploadPath(doc.fileUrl);
    if (!absPath) {
      return NextResponse.json({ error: 'Document file is missing' }, { status: 404 });
    }

    const content = await readFile(absPath);
    const ext = path.extname(doc.fileName).replace('.', '').toLowerCase() || 'pdf';

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(doc.fileName)}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    console.error('Document file error:', error);
    return NextResponse.json({ error: 'Failed to read document file' }, { status: 500 });
  }
}