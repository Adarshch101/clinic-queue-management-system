import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/apiAuth';

export async function GET(request: Request) {
  const auth = requireRole(request, ['SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const query = (searchParams.get('query') || '').toLowerCase();

    const clinicMap = new Map<string, { id: string; name: string }>();
    const clinics = await prisma.clinic.findMany({ select: { id: true, name: true } });
    clinics.forEach((c) => clinicMap.set(c.id, c));

    type UserEntry = {
      id: string;
      userId: string | null;
      name: string;
      email: string;
      phone: string | null;
      role: 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN';
      clinicId: string;
      clinicName: string;
      createdAt: Date;
    };

    const [patients, admins, doctors, receptionists] = await Promise.all([
      prisma.patient.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.clinicAdmin.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.doctor.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.receptionist.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    const users: UserEntry[] = [
      ...admins.map<UserEntry>((u) => ({
        id: u.id,
        userId: u.userId,
        name: u.name,
        email: u.email,
        phone: u.phone || null,
        role: 'ADMIN',
        clinicId: u.clinicId,
        clinicName: clinicMap.get(u.clinicId)?.name || 'Unknown',
        createdAt: u.createdAt,
      })),
      ...doctors.map<UserEntry>((u) => ({
        id: u.id,
        userId: u.userId,
        name: u.name,
        email: u.email,
        phone: u.phone || null,
        role: 'DOCTOR',
        clinicId: u.clinicId,
        clinicName: clinicMap.get(u.clinicId)?.name || 'Unknown',
        createdAt: u.createdAt,
      })),
      ...receptionists.map<UserEntry>((u) => ({
        id: u.id,
        userId: u.userId,
        name: u.name,
        email: u.email,
        phone: null,
        role: 'RECEPTIONIST',
        clinicId: u.clinicId,
        clinicName: clinicMap.get(u.clinicId)?.name || 'Unknown',
        createdAt: u.createdAt,
      })),
      ...patients.map<UserEntry>((u) => ({
        id: u.id,
        userId: u.userId,
        name: u.name,
        email: u.email || '',
        phone: u.phone,
        role: 'PATIENT',
        clinicId: u.clinicId ?? '',
        clinicName: u.clinicId ? clinicMap.get(u.clinicId)?.name || 'Unknown' : 'No Clinic',
        createdAt: u.createdAt,
      })),
    ];

    const filtered = users.filter((u) => {
      if (role && u.role !== role) return false;
      if (
        query &&
        !(
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.clinicName.toLowerCase().includes(query)
        )
      ) {
        return false;
      }
      return true;
    });

    return NextResponse.json({
      users: filtered,
      total: filtered.length,
    });
  } catch (error: unknown) {
    console.error('API Super Admin Users fetch error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
