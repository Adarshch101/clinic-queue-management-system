import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';
import { createSessionToken } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, email, role, age, gender, phone, accessToken } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    // Privileged roles must present a verifiable Supabase access token.
    // This prevents arbitrary profile creation / privileged session minting.
    const isPrivileged = ['DOCTOR', 'RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'].includes(role);
    let verifiedUserId = userId;
    let verifiedEmail = email?.toLowerCase();
    if (isPrivileged) {
      if (!accessToken) {
        return NextResponse.json({ error: 'Authentication required for privileged roles' }, { status: 401 });
      }
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
      }
      verifiedUserId = user.id;
      verifiedEmail = user.email?.toLowerCase() || verifiedEmail;
    } else {
      // PATIENT sync must also be bound to the caller's own identity: verify
      // via the Supabase access token when present, otherwise via the signed
      // server-side session cookie.
      let callerOwnsRequestedId = false;
      if (accessToken) {
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        if (!error && user && user.id === userId) {
          callerOwnsRequestedId = true;
          verifiedEmail = user.email?.toLowerCase() || verifiedEmail;
        }
      } else {
        const cookieStore = await cookies();
        const cookieSession = cookieStore.get('q-clinix-session')?.value;
        const { verifySessionToken } = await import('@/lib/session');
        const parsed = verifySessionToken(cookieSession);
        if (parsed && parsed.userId === userId) {
          callerOwnsRequestedId = true;
        }
      }

      if (!callerOwnsRequestedId) {
        return NextResponse.json(
          { error: 'Session does not match the account being synced' },
          { status: 403 }
        );
      }
    }

    // SUPER_ADMIN is only granted when the verified user's email matches the
    // configured platform admin email. Nobody may mint a SUPER_ADMIN session otherwise.
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@q-clinix.com').toLowerCase();
    if (role === 'SUPER_ADMIN' && verifiedEmail !== superAdminEmail) {
      return NextResponse.json({ error: 'You do not have platform administrator access' }, { status: 403 });
    }

    // 1. Find a clinic the user belongs to (no auto-seeding)
    const clinic = await prisma.clinic.findFirst();

    let profile: unknown = null;
    let clinicId = clinic?.id || '';
    let clinicStatus = clinic?.status || 'PENDING';
    // Privileged staff roles must ALREADY exist (created by a clinic admin invite
    // or clinic registration). Sync adopts the existing profile instead of
    // auto-creating one, so a user can never self-assign an ADMIN/DOCTOR/STAFF role.
    if (isPrivileged && role !== 'SUPER_ADMIN') {
      // Determine the user's ACTUAL profile (by auth userId, then by email for
      // profiles created by an admin invite before the invitee logged in).
      let admin = await prisma.clinicAdmin.findUnique({ where: { userId: verifiedUserId }, include: { clinic: true } });
      let doctor = await prisma.doctor.findUnique({ where: { userId: verifiedUserId } });
      let receptionist = await prisma.receptionist.findUnique({ where: { userId: verifiedUserId } });

      if (!admin && !doctor && !receptionist) {
        const adminByEmail = await prisma.clinicAdmin.findFirst({ where: { email: verifiedEmail || '' } });
        const doctorByEmail = await prisma.doctor.findFirst({ where: { email: verifiedEmail || '' } });
        const receptionistByEmail = await prisma.receptionist.findFirst({ where: { email: verifiedEmail || '' } });

        if (adminByEmail) {
          admin = await prisma.clinicAdmin.update({
            where: { id: adminByEmail.id },
            data: { userId: verifiedUserId },
            include: { clinic: true },
          });
        } else if (doctorByEmail) {
          doctor = await prisma.doctor.update({
            where: { id: doctorByEmail.id },
            data: { userId: verifiedUserId },
          });
        } else if (receptionistByEmail) {
          receptionist = await prisma.receptionist.update({
            where: { id: receptionistByEmail.id },
            data: { userId: verifiedUserId },
          });
        }
      }

      // The requested role must exactly match the user's real profile role.
      const actualRole: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | null = admin
        ? 'ADMIN'
        : doctor
          ? 'DOCTOR'
          : receptionist
            ? 'RECEPTIONIST'
            : null;

      if (!actualRole) {
        return NextResponse.json(
          { error: 'No matching staff profile found. Ask your clinic administrator for an invitation.' },
          { status: 403 }
        );
      }
      if (actualRole !== role) {
        return NextResponse.json(
          { error: 'Your account is not registered with the requested role' },
          { status: 403 }
        );
      }

      if (admin) {
        clinicId = admin.clinicId;
        clinicStatus = admin.clinic.status;
        profile = admin;
      } else if (doctor) {
        clinicId = doctor.clinicId;
        profile = doctor;
      } else if (receptionist) {
        clinicId = receptionist.clinicId;
        profile = receptionist;
      }
    }

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