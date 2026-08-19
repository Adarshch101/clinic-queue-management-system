import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const pincode = searchParams.get('pincode') || '';
    const clinicType = searchParams.get('clinicType') || 'All';
    const sortBy = searchParams.get('sortBy') || 'shortest_wait';

    // Build Prisma query clauses
    const whereClause: Prisma.ClinicWhereInput = {
      // Show only verified and operational clinics to patients
      status: 'VERIFIED',
    };

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { doctors: { some: { name: { contains: query, mode: 'insensitive' } } } },
        { doctors: { some: { specialization: { contains: query, mode: 'insensitive' } } } },
        { profile: { services: { contains: query, mode: 'insensitive' } } },
      ];
    }

    if (location) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { city: { contains: location, mode: 'insensitive' } },
        { state: { contains: location, mode: 'insensitive' } },
        { address: { contains: location, mode: 'insensitive' } },
      ];
    }

    if (pincode) {
      whereClause.pincode = { contains: pincode };
    }

    if (clinicType !== 'All') {
      whereClause.profile = {
        clinicType: clinicType,
      };
    }

    const clinics = await prisma.clinic.findMany({
      where: whereClause,
      include: {
        profile: true,
        doctors: true,
        queueTokens: {
          where: { status: 'WAITING' },
        },
      },
    });

    // Client-side mapping & sorting based on sortBy.
    // Doctors are mapped to a DTO so contact details (email/phone) and
    // the Supabase auth userId are never exposed to anonymous callers.
    const results = clinics.map((c) => {
      const waitTime = c.queueTokens.length * (c.doctors[0]?.averageConsultationTime || 12);
      return {
        ...c,
        waitTime,
        doctors: c.doctors.map((d) => ({
          id: d.id,
          name: d.name,
          specialization: d.specialization,
          roomNumber: d.roomNumber,
          qualification: d.qualification,
          experience: d.experience,
          languages: d.languages,
          bio: d.bio,
          consultationFee: d.consultationFee,
          consultationDuration: d.consultationDuration,
          averageConsultationTime: d.averageConsultationTime,
          avatarUrl: d.avatarUrl,
        })),
      };
    });

    if (sortBy === 'shortest_wait') {
      results.sort((a, b) => a.waitTime - b.waitTime);
    } else if (sortBy === 'name_asc') {
      results.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'newest') {
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return NextResponse.json(results);
  } catch (error: unknown) {
    console.error('API Search Clinics error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
