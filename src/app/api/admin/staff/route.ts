import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/apiAuth';

// Per-clinic staff limits: exactly one clinic admin, up to 10 receptionists
// and 10 doctors. The clinic admin manages these through the staff API.
const MAX_RECEPTIONISTS_PER_CLINIC = 10;
const MAX_DOCTORS_PER_CLINIC = 10;

export async function POST(request: Request) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { clinicId, role, name, email, phone, specialization, roomNumber } = await request.json();

    if (!clinicId || !role || !name || !email) {
      return NextResponse.json({ error: 'Missing staff profile details' }, { status: 400 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.clinicId && session.clinicId !== clinicId) {
      return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
    }

    if (!['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(role)) {
      return NextResponse.json({ error: 'Invalid staff role' }, { status: 400 });
    }

    // Enforce per-clinic role limits: one admin, up to 10 staff (receptionists)
    // and up to 10 doctors.
    if (role === 'ADMIN') {
      const adminCount = await prisma.clinicAdmin.count({ where: { clinicId } });
      if (adminCount >= 1) {
        return NextResponse.json({ error: 'This clinic already has an admin' }, { status: 409 });
      }
    } else if (role === 'RECEPTIONIST') {
      const receptionistCount = await prisma.receptionist.count({ where: { clinicId } });
      if (receptionistCount >= MAX_RECEPTIONISTS_PER_CLINIC) {
        return NextResponse.json(
          { error: `Clinic has reached the maximum of ${MAX_RECEPTIONISTS_PER_CLINIC} staff members` },
          { status: 409 }
        );
      }
    } else if (role === 'DOCTOR') {
      const doctorCount = await prisma.doctor.count({ where: { clinicId } });
      if (doctorCount >= MAX_DOCTORS_PER_CLINIC) {
        return NextResponse.json(
          { error: `Clinic has reached the maximum of ${MAX_DOCTORS_PER_CLINIC} doctors` },
          { status: 409 }
        );
      }
    }

    const userId = `staff-auth-${crypto.randomUUID().slice(0, 8)}`;

    let result;
    if (role === 'RECEPTIONIST') {
      result = await prisma.receptionist.create({
        data: {
          clinicId,
          userId,
          name,
          email,
        },
      });
    } else if (role === 'DOCTOR') {
      result = await prisma.doctor.create({
        data: {
          clinicId,
          userId,
          name,
          email,
          phone: phone || '',
          specialization: specialization || 'General',
          roomNumber: roomNumber || 'Room 101',
          isActive: 'true',
        },
      });
    } else if (role === 'ADMIN') {
      result = await prisma.clinicAdmin.create({
        data: {
          clinicId,
          userId,
          name,
          email,
          phone: phone || '',
        },
      });
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        clinicId,
        userId: session.userId,
        userRole: 'ADMIN',
        action: `INVITE_${role}`,
        details: `Invited new ${role}: ${name} (${email})`,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('API create staff error:', error);
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
    const staffId = searchParams.get('staffId');
    const role = searchParams.get('role');

    if (!clinicId || !staffId || !role) {
      return NextResponse.json({ error: 'Missing clinicId, staffId, or role' }, { status: 400 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.clinicId && session.clinicId !== clinicId) {
      return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
    }

    // Verify the target record belongs to the requested clinic and enforce the
    // "one admin per clinic" rule on removal.
    if (role === 'ADMIN') {
      const admin = await prisma.clinicAdmin.findUnique({ where: { id: staffId } });
      if (!admin || admin.clinicId !== clinicId) {
        return NextResponse.json({ error: 'Admin not found in this clinic' }, { status: 404 });
      }
      const adminCount = await prisma.clinicAdmin.count({ where: { clinicId } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'A clinic must have at least one admin' }, { status: 400 });
      }
      await prisma.clinicAdmin.delete({ where: { id: staffId } });
    } else if (role === 'RECEPTIONIST') {
      const receptionist = await prisma.receptionist.findUnique({ where: { id: staffId } });
      if (!receptionist || receptionist.clinicId !== clinicId) {
        return NextResponse.json({ error: 'Staff member not found in this clinic' }, { status: 404 });
      }
      await prisma.receptionist.delete({ where: { id: staffId } });
    } else if (role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { id: staffId } });
      if (!doctor || doctor.clinicId !== clinicId) {
        return NextResponse.json({ error: 'Doctor not found in this clinic' }, { status: 404 });
      }
      await prisma.doctor.delete({ where: { id: staffId } });
    } else {
      return NextResponse.json({ error: 'Invalid staff role' }, { status: 400 });
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        clinicId,
        userId: session.userId,
        userRole: 'ADMIN',
        action: `REMOVE_${role}`,
        details: `Removed staff member ${staffId} with role ${role}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('API delete staff error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
