import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';
import { RateLimiter } from '@/lib/backend/middleware/rateLimiter';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    // Rate limit registration to 10 attempts per IP per hour
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
    try {
      RateLimiter.checkLimit(`rate_register_${clientIp}`, 10, 60 * 60 * 1000);
    } catch {
      return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const {
      userId,
      accessToken,
      clinicName,
      subdomain,
      ownerName,
      email,
      phone,
      address,
      city,
      state,
      pincode,
    } = body;

    if (!userId || !clinicName || !subdomain || !ownerName || !email) {
      return NextResponse.json({ error: 'Missing required registration parameters' }, { status: 400 });
    }

    // Verify the caller actually owns the Supabase account they are binding
    // the ClinicAdmin profile to, preventing profile poisoning.
    if (accessToken) {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (error || !data.user || data.user.id !== userId) {
        return NextResponse.json({ error: 'Session does not match the account being registered' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'An authentication token is required to complete registration' }, { status: 401 });
    }

    // Input validation
    if (typeof clinicName !== 'string' || clinicName.trim().length < 2 || clinicName.trim().length > 120) {
      return NextResponse.json({ error: 'Clinic name must be between 2 and 120 characters' }, { status: 400 });
    }
    if (typeof subdomain !== 'string' || !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(subdomain.toLowerCase())) {
      return NextResponse.json({ error: 'Subdomain may only contain lowercase letters, numbers and dashes' }, { status: 400 });
    }
    if (typeof ownerName !== 'string' || ownerName.trim().length < 2 || ownerName.trim().length > 120) {
      return NextResponse.json({ error: 'Owner name must be between 2 and 120 characters' }, { status: 400 });
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }
    if (phone !== undefined && phone !== null && phone !== '' && !/^[+\d][\d\s-]{7,19}$/.test(String(phone))) {
      return NextResponse.json({ error: 'Please provide a valid phone number' }, { status: 400 });
    }

    // Check subdomain uniqueness
    const existingClinic = await prisma.clinic.findUnique({
      where: { subdomain: subdomain.toLowerCase() },
    });

    if (existingClinic) {
      return NextResponse.json({ error: 'Subdomain is already registered by another clinic' }, { status: 409 });
    }

    // Create clinic and default admin profile transactionally
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Clinic
      const clinic = await tx.clinic.create({
        data: {
          name: clinicName.trim(),
          subdomain: subdomain.toLowerCase(),
          status: 'PENDING',
          ownerName: ownerName.trim(),
          phone,
          email: email.toLowerCase(),
          address,
          city,
          state,
          pincode,
        },
      });

      // 2. Create Clinic Admin Profile
      const admin = await tx.clinicAdmin.create({
        data: {
          clinicId: clinic.id,
          userId,
          name: ownerName.trim(),
          email: email.toLowerCase(),
          phone,
        },
      });

      // 3. Create default working hours
      const days = [
        { name: 'Sunday', code: 0 },
        { name: 'Monday', code: 1 },
        { name: 'Tuesday', code: 2 },
        { name: 'Wednesday', code: 3 },
        { name: 'Thursday', code: 4 },
        { name: 'Friday', code: 5 },
        { name: 'Saturday', code: 6 },
      ];
      await Promise.all(
        days.map((day) =>
          tx.workingHours.create({
            data: {
              clinicId: clinic.id,
              dayOfWeek: day.code,
              startTime: '09:00 AM',
              endTime: day.name === 'Saturday' ? '01:00 PM' : '05:00 PM',
              isClosed: day.name === 'Sunday',
            },
          })
        )
      );

      return { clinicId: clinic.id, adminId: admin.id };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('API register error:', error);
    return NextResponse.json({ error: error instanceof Error ? (error.message || 'Database registration failure') : String(error) }, { status: 500 });
  }
}
