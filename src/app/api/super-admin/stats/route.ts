import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/apiAuth';

export async function GET(request: Request) {
  const auth = requireRole(request, ['SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  try {
    // 1. Fetch clinic statistics
    const totalClinics = await prisma.clinic.count();
    const verifiedClinics = await prisma.clinic.count({ where: { status: 'VERIFIED' } });
    const pendingClinics = await prisma.clinic.count({ where: { status: 'PENDING' } });
    const suspendedClinics = await prisma.clinic.count({ where: { status: 'SUSPENDED' } });
    const rejectedClinics = await prisma.clinic.count({ where: { status: 'REJECTED' } });

    // Active tokens today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalTokensToday = await prisma.queueToken.count({ where: { createdAt: { gte: today } } });
    const waitingTokens = await prisma.queueToken.count({ where: { status: 'WAITING', createdAt: { gte: today } } });
    const servedTokens = await prisma.queueToken.count({ where: { status: 'COMPLETED', createdAt: { gte: today } } });

    // 2. Fetch all clinics with profiles & verification requests
    const clinics = await prisma.clinic.findMany({
      include: {
        profile: true,
        verificationRequests: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
        doctors: true,
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Get / Seed Feature Flags
    let flags = await prisma.featureFlag.findMany();
    if (flags.length === 0) {
      const defaultFlags = [
        { name: 'Queue', isEnabled: true, description: 'Live waitlist queue engine' },
        { name: 'Appointments', isEnabled: true, description: 'Pre-scheduled booking slots' },
        { name: 'SMS Alerts', isEnabled: false, description: 'Text message token notifications' },
        { name: 'WhatsApp', isEnabled: false, description: 'WhatsApp queue position alerts' },
        { name: 'AI Assistant', isEnabled: true, description: 'AI consult duration wait time calibrator' },
        { name: 'QR Check-In', isEnabled: true, description: 'Self check-in QR codes' },
        { name: 'Telemedicine', isEnabled: false, description: 'Virtual consults video dashboard' },
      ];
      for (const f of defaultFlags) {
        await prisma.featureFlag.create({ data: f });
      }
      flags = await prisma.featureFlag.findMany();
    }

    // 4. Get / Seed Platform Settings
    let settings = await prisma.platformSettings.findFirst();
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          platformName: 'Q-Clinix Platform',
          brandingColor: '#3b82f6',
          supportEmail: 'admin@qclinix.com',
          supportPhone: '+1-800-555-0199',
          maintenance: false,
        },
      });
    }

    // 5. Fetch announcements
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // 6. Fetch all platform audit logs
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      stats: {
        totalClinics,
        verifiedClinics,
        pendingClinics,
        suspendedClinics,
        rejectedClinics,
        totalTokensToday,
        waitingTokens,
        servedTokens,
      },
      clinics,
      featureFlags: flags,
      platformSettings: settings,
      announcements,
      auditLogs: logs,
    });
  } catch (error: unknown) {
    console.error('API Super Admin Stats fetch error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
