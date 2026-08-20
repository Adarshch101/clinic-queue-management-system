import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, sessionHasClinicAccess } from '@/lib/apiAuth';
import { saveUploadFile, deleteUploadFile, validateUploadFile } from '@/lib/fileStorage';

export async function POST(request: Request) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const formData = await request.formData();
    const clinicId = formData.get('clinicId') as string;
    const documentType = formData.get('documentType') as string;
    const file = formData.get('file') as File;

    if (!clinicId || !documentType || !file) {
      return NextResponse.json({ error: 'Missing clinicId, documentType or file' }, { status: 400 });
    }

    const fileError = validateUploadFile(file);
    if (fileError) {
      return NextResponse.json({ error: fileError }, { status: 400 });
    }

    if (!sessionHasClinicAccess(session, clinicId)) {
      return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
    }

    // Persist the actual file bytes to private storage
    const { fileKey } = await saveUploadFile('documents', file);

    // Write document metadata record to PostgreSQL database
    const doc = await prisma.clinicDocument.create({
      data: {
        clinicId,
        fileName: file.name,
        fileUrl: fileKey,
        fileType: file.type || 'application/pdf',
        documentType,
      },
    });

    return NextResponse.json(
      {
        ...doc,
        fileUrl: `/api/files/document?documentId=${doc.id}`,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('API upload error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    const documentId = searchParams.get('documentId');

    if (!clinicId || !documentId) {
      return NextResponse.json({ error: 'Missing clinicId or documentId' }, { status: 400 });
    }

    if (!sessionHasClinicAccess(session, clinicId)) {
      return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
    }

    const doc = await prisma.clinicDocument.findUnique({ where: { id: documentId } });
    // Fail-closed: the document must exist AND belong to the caller's clinic.
    // Checking only the clinicId query param would let an admin of clinic A
    // delete clinic B's verification documents (cross-tenant IDOR).
    if (!doc || doc.clinicId !== clinicId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await deleteUploadFile(doc.fileUrl);

    await prisma.clinicDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('API document delete error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}