import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, sessionHasClinicAccess } from '@/lib/apiAuth';
import { saveUploadFile, getUploadFileSize, deleteUploadFile, formatFileSize } from '@/lib/fileStorage';

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const userId = searchParams.get('userId');

    let resolvedPatientId = patientId;

    // Patients can only ever see their own reports.
    if (session.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: session.userId } });
      if (patient) resolvedPatientId = patient.id;
    } else if (userId) {
      const patient = await prisma.patient.findUnique({ where: { userId } });
      if (patient) resolvedPatientId = patient.id;
    }

    if (!resolvedPatientId) {
      return NextResponse.json([]);
    }

    // Staff must only access reports of patients belonging to their own clinic.
    if (session.role !== 'PATIENT') {
      const targetPatient = await prisma.patient.findUnique({ where: { id: resolvedPatientId } });
      if (!targetPatient || !sessionHasClinicAccess(session, targetPatient.clinicId)) {
        return NextResponse.json({ error: 'You do not have access to this patient' }, { status: 403 });
      }
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
  const auth = requireRole(request, ['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const reportType = (formData.get('reportType') as string) || 'General';
    const fileType = (formData.get('fileType') as string) || 'pdf';
    const patientId = formData.get('patientId') as string;

    if (!file || !file.name) {
      return NextResponse.json({ error: 'A file is required' }, { status: 400 });
    }

    let targetPatientId = patientId;

    if (session.role === 'PATIENT') {
      // Patients may only upload their own reports.
      const patient = await prisma.patient.findUnique({ where: { userId: session.userId } });
      if (!patient) {
        return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 });
      }
      targetPatientId = patient.id;
    } else {
      // Staff may attach a report to any patient within their own clinic.
      if (!targetPatientId) {
        return NextResponse.json({ error: 'patientId is required for staff uploads' }, { status: 400 });
      }
      const patient = await prisma.patient.findUnique({ where: { id: targetPatientId } });
      if (!patient || !sessionHasClinicAccess(session, patient.clinicId)) {
        return NextResponse.json({ error: 'You do not have access to this patient' }, { status: 403 });
      }
    }

    // Persist the actual file bytes to local storage
    const { fileUrl, size } = await saveUploadFile('reports', file);

    const report = await prisma.medicalReport.create({
      data: {
        patientId: targetPatientId,
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
  const auth = requireRole(request, ['PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN']);
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

    if (session.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: session.userId } });
      if (!patient || report.patientId !== patient.id) {
        return NextResponse.json({ error: 'You can only delete your own reports' }, { status: 403 });
      }
    } else if (!sessionHasClinicAccess(session, report.patient.clinicId)) {
      return NextResponse.json({ error: 'You do not have access to this patient' }, { status: 403 });
    }

    await deleteUploadFile(report.fileUrl);

    await prisma.medicalReport.delete({ where: { id: reportId } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}