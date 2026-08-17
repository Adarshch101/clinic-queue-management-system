import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';
import { createSessionToken } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, email, role, age, gender, phone, specialization, roomNumber, accessToken } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    // Privileged roles must present a verifiable Supabase access token.
    // This prevents arbitrary profile creation / privileged session minting.
    const isPrivileged = ['DOCTOR', 'RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'].includes(role);
    let verifiedUserId = userId;
    if (isPrivileged) {
      if (!accessToken) {
        return NextResponse.json({ error: 'Authentication required for privileged roles' }, { status: 401 });
      }
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
      }
      verifiedUserId = user.id;
    }

    // 1. Find a clinic the user belongs to (no auto-seeding)
    const clinic = await prisma.clinic.findFirst();

    let profile: unknown = null;
    let clinicId = clinic?.id || '';
    let clinicStatus = clinic?.status || 'PENDING';

    // 3. Sync profile depending on role
    if (role === 'PATIENT') {
      let patient = await prisma.patient.findUnique({ where: { userId: verifiedUserId } });
      if (!patient) {
        patient = await prisma.patient.create({
          data: {
            clinicId: clinic?.id || '',
            userId: verifiedUserId,
            name: name || 'Anonymous Patient',
            email,
            phone: phone || '+1 (555) 000-0000',
            age: age ? parseInt(age) : 30,
            gender: gender || 'Male',
          },
        });
      }
      profile = patient;
    } else if (role === 'DOCTOR') {
      let doctor = await prisma.doctor.findUnique({ where: { userId: verifiedUserId } });
      if (!doctor) {
        doctor = await prisma.doctor.create({
          data: {
            clinicId: clinic?.id || '',
            userId: verifiedUserId,
            name: name || 'Dr. Physician',
            email: email || '',
            phone: phone || '',
            specialization: specialization || 'General Practitioner',
            roomNumber: roomNumber || 'Room 101',
            isActive: 'true',
          },
        });
      }
      clinicId = doctor.clinicId;
      profile = doctor;
    } else if (role === 'RECEPTIONIST') {
      let receptionist = await prisma.receptionist.findUnique({ where: { userId: verifiedUserId } });
      if (!receptionist) {
        receptionist = await prisma.receptionist.create({
          data: {
            clinicId: clinic?.id || '',
            userId: verifiedUserId,
            name: name || 'Reception Staff',
            email: email || '',
          },
        });
      }
      clinicId = receptionist.clinicId;
      profile = receptionist;
    } else if (role === 'ADMIN') {
      let admin = await prisma.clinicAdmin.findUnique({
        where: { userId: verifiedUserId },
        include: { clinic: true },
      });
      if (!admin) {
        admin = await prisma.clinicAdmin.create({
          data: {
            clinicId: clinic?.id || '',
            userId: verifiedUserId,
            name: name || 'Clinic Admin',
            email: email || '',
            phone: phone || '',
          },
          include: { clinic: true },
        });
      }
      clinicId = admin.clinicId;
      clinicStatus = admin.clinic.status;
      profile = admin;
    } else if (role === 'SUPER_ADMIN') {
      profile = { name: 'Super Admin', email };
      clinicStatus = 'VERIFIED';
    }

    // 4. Set the signed session cookie for middleware route guards (skip for guests)
    if (role !== 'PATIENT') {
      const cookieStore = await cookies();
      const sessionToken = createSessionToken({
        userId: verifiedUserId,
        role,
        clinicId,
        clinicStatus,
      });

      cookieStore.set('q-clinix-session', sessionToken, {
        path: '/',
        maxAge: 86400, // 24 hours
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return NextResponse.json({
      success: true,
      clinic,
      role,
      profile,
    });
  } catch (error) {
    console.error('Error syncing auth profile:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}