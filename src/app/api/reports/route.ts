import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { saveUploadFile, getUploadFileSize, deleteUploadFile, formatFileSize } from '@/lib/fileStorage';

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    let resolvedPatientId = patientId;

    if (session.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: session.userId } });
      if (patient) resolvedPatientId = patient.id;
    }

    if (!resolvedPatientId) {
      return NextResponse.json([]);
    }

    const reports = await prisma.medicalReport.findMany({
      where: { patientId: resolvedPatientId },
      orderBy: { uploadedAt: 'desc' },
    });

    const formatted = [];
    for (const r of reports) {
      const size = await getUploadFileSize(r.fileUrl);
      formatted.push({
        id: r.id,
        patientId: r.patientId,
        fileName: r.fileName,
        fileUrl: r.fileUrl,
        fileType: r.fileType.toLowerCase() === 'pdf' ? 'pdf' : 'image',
        reportType: r.reportType,
        uploadedAt: r.uploadedAt.toISOString(),
        size: formatFileSize(size),
      });
    }

    return NextResponse.json(formatted);
  } catch (error: unknown) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const reportType = (formData.get('reportType') as string) || 'General';
    const fileType = (formData.get('fileType') as string) || 'pdf';

    if (!file || !file.name) {
      return NextResponse.json({ error: 'A file is required' }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({ where: { userId: session.userId } });
    if (!patient) {
      return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 });
    }

    // Persist the actual file bytes to local storage
    const { fileUrl, size } = await saveUploadFile('reports', file);

    const report = await prisma.medicalReport.create({
      data: {
        patientId: patient.id,
        fileName: file.name,
        fileUrl,
        fileType,
        reportType,
      },
    });

    return NextResponse.json({
      id: report.id,
      patientId: report.patientId,
      fileName: report.fileName,
      fileUrl: report.fileUrl,
      fileType: report.fileType.toLowerCase() === 'pdf' ? 'pdf' : 'image',
      reportType: report.reportType,
      uploadedAt: report.uploadedAt.toISOString(),
      size: formatFileSize(size),
    });
  } catch (error: unknown) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json({ error: 'Missing reportId' }, { status: 400 });
    }

    const report = await prisma.medicalReport.findUnique({ where: { id: reportId } });

    if (session.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: session.userId } });
      if (!patient || report?.patientId !== patient.id) {
        return NextResponse.json({ error: 'You can only delete your own reports' }, { status: 403 });
      }
    }

    if (report) {
      await deleteUploadFile(report.fileUrl);
    }

    await prisma.medicalReport.delete({ where: { id: reportId } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}