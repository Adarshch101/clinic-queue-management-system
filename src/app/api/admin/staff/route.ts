import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/apiAuth';

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

    if (role === 'RECEPTIONIST') {
      await prisma.receptionist.delete({ where: { id: staffId } });
    } else if (role === 'DOCTOR') {
      await prisma.doctor.delete({ where: { id: staffId } });
    } else if (role === 'ADMIN') {
      await prisma.clinicAdmin.delete({ where: { id: staffId } });
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
