import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireClinicAccess } from '@/lib/apiAuth';

export async function GET(request: Request) {
  const auth = requireClinicAccess(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json({ error: 'Missing clinicId' }, { status: 400 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.clinicId && session.clinicId !== clinicId) {
      return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
    }

    // Load profile, settings, and doctors
    const profile = await prisma.clinicProfile.findUnique({ where: { clinicId } });
    const settings = await prisma.clinicSettings.findUnique({ where: { clinicId } });
    const doctors = await prisma.doctor.findMany({ where: { clinicId } });
    const documents = await prisma.clinicDocument.findMany({ where: { clinicId } });
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });

    if (!profile) {
      // Return empty configuration if no draft has been saved yet
      return NextResponse.json({
        stepData: {
          clinicName: clinic?.name || '',
          primaryEmail: clinic?.email || '',
          primaryPhone: clinic?.phone || '',
          addressLine1: clinic?.address || '',
          city: clinic?.city || '',
          state: clinic?.state || '',
          pincode: clinic?.pincode || '',
          doctors: [],
          documents: [],
        }
      });
    }

    // Map DB fields back into unified wizard payload
    const stepData = {
      clinicName: clinic?.name || '',
      legalBusinessName: profile.legalBusinessName || '',
      logoUrl: clinic?.logoUrl || '🏥',
      bannerUrl: profile.bannerUrl || '',
      tagline: profile.tagline || '',
      description: profile.description || '',
      establishedYear: profile.establishedYear || 2020,
      clinicType: profile.clinicType || 'Multi Doctor',
      
      primaryEmail: clinic?.email || '',
      primaryPhone: clinic?.phone || '',
      emergencyPhone: profile.emergencyPhone || '',
      website: profile.googleMapsUrl || '', // website alias or map
      supportEmail: profile.supportEmail || '',
      whatsappNumber: profile.whatsappNumber || '',
      
      country: profile.country || 'United States',
      state: clinic?.state || '',
      city: clinic?.city || '',
      addressLine1: clinic?.address || '',
      addressLine2: profile.landmark || '',
      landmark: profile.landmark || '',
      pincode: clinic?.pincode || '',
      latitude: profile.latitude || 0,
      longitude: profile.longitude || 0,
      googleMapsUrl: profile.googleMapsUrl || '',
      
      doctors: doctors.map(d => ({
        id: d.id,
        name: d.name,
        qualification: d.qualification || '',
        specialization: d.specialization || '',
        experience: d.experience || 5,
        registrationNumber: d.registrationNumber || '',
        consultationFee: d.consultationFee || 50,
        consultationDuration: d.consultationDuration || 15,
      })),
      
      services: profile.services || '',
      
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      openingTime: '09:00 AM',
      closingTime: '05:00 PM',
      lunchBreak: '01:00 PM - 02:00 PM',
      averageConsultationTime: settings?.slotDuration || 15,
      maxQueueSize: settings?.maxQueueSize || 50,
      
      documents: documents.map(d => ({
        id: d.id,
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        fileType: d.fileType,
        documentType: d.documentType,
      })),
      
      tokenPrefix: settings?.tokenPrefix || 'T',
      maxDailyTokens: settings?.maxDailyTokens || 100,
      timezone: settings?.timezone || 'EST',
      language: settings?.language || 'en',
      queueEnabled: settings?.queueEnabled ?? true,
      appointmentsEnabled: settings?.appointmentsEnabled ?? true,
      walkInPatients: settings?.walkInPatients ?? true,
      emergencyQueue: settings?.emergencyQueue ?? true,
    };

    return NextResponse.json({ stepData });
  } catch (error: unknown) {
    console.error('Fetch draft error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireClinicAccess(request, ['ADMIN', 'SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { clinicId, stepData } = await request.json();

    if (!clinicId || !stepData) {
      return NextResponse.json({ error: 'Missing clinicId or stepData' }, { status: 400 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.clinicId && session.clinicId !== clinicId) {
      return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
    }

    // Persist draft transactionally
    await prisma.$transaction(async (tx) => {
      // 1. Update general Clinic details
      await tx.clinic.update({
        where: { id: clinicId },
        data: {
          name: stepData.clinicName || '',
          logoUrl: stepData.logoUrl || '🏥',
          email: stepData.primaryEmail || '',
          phone: stepData.primaryPhone || '',
          address: stepData.addressLine1 || '',
          city: stepData.city || '',
          state: stepData.state || '',
          pincode: stepData.pincode || '',
        },
      });

      // 2. Create/Update Profile
      await tx.clinicProfile.upsert({
        where: { clinicId },
        update: {
          legalBusinessName: stepData.legalBusinessName || '',
          bannerUrl: stepData.bannerUrl || '',
          tagline: stepData.tagline || '',
          description: stepData.description || '',
          establishedYear: stepData.establishedYear || 2020,
          clinicType: stepData.clinicType || 'Multi Doctor',
          country: stepData.country || 'United States',
          landmark: stepData.landmark || '',
          googleMapsUrl: stepData.googleMapsUrl || '',
          services: stepData.services || '',
          whatsappNumber: stepData.whatsappNumber || '',
          emergencyPhone: stepData.emergencyPhone || '',
          supportEmail: stepData.supportEmail || '',
        },
        create: {
          clinicId,
          legalBusinessName: stepData.legalBusinessName || '',
          bannerUrl: stepData.bannerUrl || '',
          tagline: stepData.tagline || '',
          description: stepData.description || '',
          establishedYear: stepData.establishedYear || 2020,
          clinicType: stepData.clinicType || 'Multi Doctor',
          country: stepData.country || 'United States',
          landmark: stepData.landmark || '',
          googleMapsUrl: stepData.googleMapsUrl || '',
          services: stepData.services || '',
          whatsappNumber: stepData.whatsappNumber || '',
          emergencyPhone: stepData.emergencyPhone || '',
          supportEmail: stepData.supportEmail || '',
        },
      });

      // 3. Create/Update Settings
      await tx.clinicSettings.upsert({
        where: { clinicId },
        update: {
          tokenPrefix: stepData.tokenPrefix || 'T',
          maxDailyTokens: stepData.maxDailyTokens || 100,
          timezone: stepData.timezone || 'EST',
          language: stepData.language || 'en',
          queueEnabled: stepData.queueEnabled ?? true,
          appointmentsEnabled: stepData.appointmentsEnabled ?? true,
          walkInPatients: stepData.walkInPatients ?? true,
          emergencyQueue: stepData.emergencyQueue ?? true,
          maxQueueSize: stepData.maxQueueSize || 50,
          slotDuration: stepData.averageConsultationTime || 15,
        },
        create: {
          clinicId,
          tokenPrefix: stepData.tokenPrefix || 'T',
          maxDailyTokens: stepData.maxDailyTokens || 100,
          timezone: stepData.timezone || 'EST',
          language: stepData.language || 'en',
          queueEnabled: stepData.queueEnabled ?? true,
          appointmentsEnabled: stepData.appointmentsEnabled ?? true,
          walkInPatients: stepData.walkInPatients ?? true,
          emergencyQueue: stepData.emergencyQueue ?? true,
          maxQueueSize: stepData.maxQueueSize || 50,
          slotDuration: stepData.averageConsultationTime || 15,
        },
      });

      // 4. Update Doctors Roster
      if (stepData.doctors && stepData.doctors.length > 0) {
        // Delete older ones and overwrite for draft simplicity in this phase
        await tx.doctor.deleteMany({ where: { clinicId } });
        
        for (const doc of stepData.doctors) {
          await tx.doctor.create({
            data: {
              clinicId,
              userId: `doc-auth-${crypto.randomUUID().slice(0, 8)}`,
              name: doc.name,
              email: doc.email || `${doc.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@clinic.com`,
              phone: doc.phone || '',
              specialization: doc.specialization,
              roomNumber: 'Room 101',
              qualification: doc.qualification,
              experience: doc.experience,
              registrationNumber: doc.registrationNumber,
              consultationFee: doc.consultationFee,
              consultationDuration: doc.consultationDuration,
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Save draft error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
