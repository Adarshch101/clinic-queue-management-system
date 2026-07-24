import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, email, role, age, gender, phone, specialization, roomNumber } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    // 1. Ensure a default Clinic exists (Multi-tenant seed fallback)
    let clinic = await prisma.clinic.findFirst();
    if (!clinic) {
      clinic = await prisma.clinic.create({
        data: {
          id: 'clinic-1',
          name: 'CareFirst Medical Center',
          subdomain: 'carefirst',
          logoUrl: '🏥',
          primaryColor: '#2563eb',
        },
      });

      // Seed working hours for the clinic
      await prisma.workingHours.createMany({
        data: [
          { clinicId: 'clinic-1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isClosed: false },
          { clinicId: 'clinic-1', dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isClosed: false },
          { clinicId: 'clinic-1', dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isClosed: false },
          { clinicId: 'clinic-1', dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isClosed: false },
          { clinicId: 'clinic-1', dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isClosed: false },
          { clinicId: 'clinic-1', dayOfWeek: 6, startTime: '09:00', endTime: '13:00', isClosed: false },
          { clinicId: 'clinic-1', dayOfWeek: 0, startTime: 'Closed', endTime: 'Closed', isClosed: true },
        ],
      });
    }

    // 2. Seed default doctors so there is data available for check-ins
    const existingDr1 = await prisma.doctor.findFirst({ where: { specialization: 'Cardiologist' } });
    if (!existingDr1) {
      await prisma.doctor.create({
        data: {
          id: 'doc-1',
          clinicId: clinic.id,
          userId: 'doc-auth-1', // Placeholder auth ID
          name: 'Dr. Sarah Jenkins',
          email: 's.jenkins@carefirst.com',
          specialization: 'Cardiologist',
          roomNumber: 'Room 102',
          isActive: 'true',
        },
      });
    }

    const existingDr2 = await prisma.doctor.findFirst({ where: { specialization: 'Pediatrician' } });
    if (!existingDr2) {
      await prisma.doctor.create({
        data: {
          id: 'doc-2',
          clinicId: clinic.id,
          userId: 'doc-auth-2',
          name: 'Dr. Robert Chen',
          email: 'r.chen@carefirst.com',
          specialization: 'Pediatrician',
          roomNumber: 'Room 105',
          isActive: 'true',
        },
      });
    }

    let profile: any = null;

    // 3. Sync profile depending on role
    if (role === 'PATIENT') {
      profile = await prisma.patient.findUnique({ where: { userId } });
      if (!profile) {
        profile = await prisma.patient.create({
          data: {
            clinicId: clinic.id,
            userId,
            name: name || 'Anonymous Patient',
            email,
            phone: phone || '+1 (555) 000-0000',
            age: age ? parseInt(age) : 30,
            gender: gender || 'Male',
          },
        });
      }
    } else if (role === 'DOCTOR') {
      profile = await prisma.doctor.findUnique({ where: { userId } });
      if (!profile) {
        profile = await prisma.doctor.create({
          data: {
            clinicId: clinic.id,
            userId,
            name: name || 'Dr. Physician',
            email: email || '',
            phone: phone || '',
            specialization: specialization || 'General Practitioner',
            roomNumber: roomNumber || 'Room 101',
            isActive: 'true',
          },
        });
      }
    } else if (role === 'RECEPTIONIST') {
      profile = await prisma.receptionist.findUnique({ where: { userId } });
      if (!profile) {
        profile = await prisma.receptionist.create({
          data: {
            clinicId: clinic.id,
            userId,
            name: name || 'Reception Staff',
            email: email || '',
          },
        });
      }
    } else if (role === 'ADMIN') {
      // Admins are mapped at the clinic level
      profile = { isAdmin: true, name: name || 'Clinic Admin', email };
    }

    return NextResponse.json({
      success: true,
      clinic,
      role,
      profile,
    });
  } catch (error: any) {
    console.error('Error syncing auth profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
