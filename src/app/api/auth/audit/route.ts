import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, action, details, clinicId: inputClinicId } = body;

    if (!userId || !action || !details) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    let resolvedClinicId = inputClinicId;
    let resolvedRole: Role = 'PATIENT';

    // 1. Resolve clinic and role if not supplied
    if (!resolvedClinicId || resolvedClinicId === 'anonymous') {
      // Find admin, doctor, or receptionist
      const admin = await prisma.clinicAdmin.findUnique({ where: { userId } });
      if (admin) {
        resolvedClinicId = admin.clinicId;
        resolvedRole = 'ADMIN';
      } else {
        const doc = await prisma.doctor.findUnique({ where: { userId } });
        if (doc) {
          resolvedClinicId = doc.clinicId;
          resolvedRole = 'DOCTOR';
        } else {
          const recep = await prisma.receptionist.findUnique({ where: { userId } });
          if (recep) {
            resolvedClinicId = recep.clinicId;
            resolvedRole = 'RECEPTIONIST';
          }
        }
      }
    } else {
      // Input clinic was specified, resolve role
      const admin = await prisma.clinicAdmin.findUnique({ where: { userId } });
      if (admin) resolvedRole = 'ADMIN';
      else {
        const doc = await prisma.doctor.findUnique({ where: { userId } });
        if (doc) resolvedRole = 'DOCTOR';
        else {
          const recep = await prisma.receptionist.findUnique({ where: { userId } });
          if (recep) resolvedRole = 'RECEPTIONIST';
        }
      }
    }

    // If clinic ID still unresolved, skip audit log (no valid clinic to associate with)
    if (!resolvedClinicId) {
      return NextResponse.json({ success: true, logId: null, warning: 'No clinic found for audit log' });
    }

    // Write audit log entry
    const log = await prisma.auditLog.create({
      data: {
        clinicId: resolvedClinicId,
        userId,
        userRole: resolvedRole,
        action,
        details,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    return NextResponse.json({ success: true, logId: log.id });
  } catch (error) {
    console.error('API audit log error:', error);
    return NextResponse.json({ error: error instanceof Error ? (error.message || 'Audit log write failure') : String(error) }, { status: 500 });
  }
}
