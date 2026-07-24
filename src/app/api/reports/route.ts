import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const patientId = searchParams.get('patientId');

    let resolvedPatientId = patientId;

    if (userId) {
      const patient = await prisma.patient.findUnique({ where: { userId } });
      if (patient) resolvedPatientId = patient.id;
    }

    if (!resolvedPatientId) {
      return NextResponse.json([]);
    }

    const reports = await prisma.medicalReport.findMany({
      where: { patientId: resolvedPatientId },
      orderBy: { uploadedAt: 'desc' },
    });

    const formatted = reports.map((r: any) => ({
      id: r.id,
      patientId: r.patientId,
      fileName: r.fileName,
      fileType: r.fileType.toLowerCase() === 'pdf' ? 'pdf' : 'image',
      reportType: r.reportType,
      uploadedAt: r.uploadedAt.toISOString(),
      size: '2.4 MB', // Placeholder size
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, fileName, fileType, reportType } = body;

    if (!userId || !fileName || !fileType || !reportType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
      return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 });
    }

    const report = await prisma.medicalReport.create({
      data: {
        patientId: patient.id,
        fileName,
        fileUrl: `https://supabase.storage/${fileName}`, // Placeholder storage URL
        fileType,
        reportType,
      },
    });

    return NextResponse.json({
      id: report.id,
      patientId: report.patientId,
      fileName: report.fileName,
      fileType: report.fileType.toLowerCase() === 'pdf' ? 'pdf' : 'image',
      reportType: report.reportType,
      uploadedAt: report.uploadedAt.toISOString(),
      size: '2.4 MB',
    });
  } catch (error: any) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
