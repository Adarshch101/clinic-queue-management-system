import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, sessionHasClinicAccess } from '@/lib/apiAuth';

export async function POST(request: Request) {
  const auth = requireRole(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { 
      clinicId, name, logoUrl, address, city, state, pincode,
      tagline, description, establishedYear, clinicType, country, landmark,
      services, whatsappNumber, emergencyPhone, supportEmail
    } = await request.json();

    if (!clinicId) {
      return NextResponse.json({ error: 'Missing clinicId' }, { status: 400 });
    }

    // Verify the session is authorized for this clinic
    if (!sessionHasClinicAccess(session, clinicId)) {
      return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update Clinic general
      const clinic = await tx.clinic.update({
        where: { id: clinicId },
        data: {
          name,
          logoUrl,
          address,
          city,
          state,
          pincode,
        },
      });

      // Update Clinic Profile
      const profile = await tx.clinicProfile.upsert({
        where: { clinicId },
        update: {
          tagline,
          description,
          establishedYear: parseInt(establishedYear) || 2020,
          clinicType,
          country,
          landmark,
          services,
          whatsappNumber,
          emergencyPhone,
          supportEmail,
        },
        create: {
          clinicId,
          tagline,
          description,
          establishedYear: parseInt(establishedYear) || 2020,
          clinicType,
          country,
          landmark,
          services,
          whatsappNumber,
          emergencyPhone,
          supportEmail,
        },
      });

      // Audit Log entry
      await tx.auditLog.create({
        data: {
          clinicId,
          userId: session.userId,
          userRole: session.role as 'ADMIN' | 'SUPER_ADMIN',
          action: 'UPDATE_CLINIC_PROFILE',
          details: `Clinic profile details updated by administrator`,
        },
      });

      return { clinic, profile };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('API update clinic profile error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
