import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireClinicAccess, sessionHasClinicAccess } from '@/lib/apiAuth';
import { saveUploadFile, deleteUploadFile } from '@/lib/fileStorage';

export async function POST(request: Request) {
  const auth = requireClinicAccess(request, ['ADMIN', 'SUPER_ADMIN']);
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

    if (!sessionHasClinicAccess(session, clinicId)) {
      return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
    }

    // Persist the actual file bytes to local storage
    const { fileUrl } = await saveUploadFile('documents', file);

    // Write document metadata record to PostgreSQL database
    const doc = await prisma.clinicDocument.create({
      data: {
        clinicId,
        fileName: file.name,
        fileUrl,
        fileType: file.type || 'application/pdf',
        documentType,
      },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error: unknown) {
    console.error('API upload error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = requireClinicAccess(request, ['ADMIN', 'SUPER_ADMIN']);
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
    if (doc) {
      await deleteUploadFile(doc.fileUrl);
    }

    await prisma.clinicDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('API document delete error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}