import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';

// Resolves the signed-in user's Doctor record (if any). Used by the doctor
// dashboard to identify "my doctor" by record id instead of the auth userId.
// Returns null for users without a Doctor row (e.g. admin previewing the page).
export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.userId },
    });

    if (!doctor) return NextResponse.json(null);

    return NextResponse.json({
      id: doctor.id,
      clinicId: doctor.clinicId,
      userId: doctor.userId,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialization: doctor.specialization,
      roomNumber: doctor.roomNumber,
      isActive: doctor.isActive,
      averageConsultationTime: doctor.averageConsultationTime,
      avatar: doctor.avatarUrl,
      qualification: doctor.qualification,
      experience: doctor.experience,
    });
  } catch (error) {
    console.error('Error resolving doctor profile:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}