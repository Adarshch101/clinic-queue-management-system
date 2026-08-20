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
      RateLimiter.checkLimit(`rate_register_patient_${clientIp}`, 10, 60 * 60 * 1000);
    } catch {
      return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const {
      userId,
      accessToken,
      name,
      email,
      phone,
      age,
      gender,
    } = body;

    if (!userId || !name || !email || !phone) {
      return NextResponse.json({ error: 'Missing required registration parameters' }, { status: 400 });
    }

    // Verify the caller actually owns the Supabase account they are binding
    // this profile to, preventing profile poisoning of arbitrary userIds.
    if (accessToken) {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (error || !data.user || data.user.id !== userId) {
        return NextResponse.json({ error: 'Session does not match the account being registered' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'An authentication token is required to complete registration' }, { status: 401 });
    }

    // Input validation
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120) {
      return NextResponse.json({ error: 'Name must be between 2 and 120 characters' }, { status: 400 });
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }
    if (!/^[+\d][\d\s-]{7,19}$/.test(String(phone))) {
      return NextResponse.json({ error: 'Please provide a valid phone number' }, { status: 400 });
    }
    const parsedAge = parseInt(String(age), 10);
    if (Number.isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      return NextResponse.json({ error: 'Please provide a valid age (1-120)' }, { status: 400 });
    }
    if (typeof gender !== 'string' || !['Male', 'Female', 'Other'].includes(gender)) {
      return NextResponse.json({ error: 'Invalid gender value' }, { status: 400 });
    }

    // Look up existing patient rows by email and by userId. Patient.userId is
    // unique, so a row may already exist for this user from a previous attempt
    // or from /api/auth/sync auto-seeding them to the first clinic.
    const existingByEmail = await prisma.patient.findFirst({
      where: { email: email.toLowerCase() },
    });
    const existingByUser = await prisma.patient.findUnique({
      where: { userId },
    });

    // Another account already owns this email.
    if (existingByEmail && existingByEmail.userId && existingByEmail.userId !== userId) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Create/update patient profile with nullable clinicId (general user registration)
    const result = await prisma.$transaction(async (tx) => {
      // The caller already has a patient row — update its identity details
      // instead of creating a duplicate (Patient.userId is unique). clinicId is
      // preserved so an existing clinic binding is not wiped by a re-submit.
      if (existingByUser) {
        const updated = await tx.patient.update({
          where: { id: existingByUser.id },
          data: {
            name: name.trim(),
            email: email.toLowerCase(),
            phone: phone.trim(),
            age: parsedAge,
            gender,
          },
        });
        return { patientId: updated.id };
      }

      // If there's an existing walk-in patient row with this email (no userId), link it
      if (existingByEmail && !existingByEmail.userId) {
        const updated = await tx.patient.update({
          where: { id: existingByEmail.id },
          data: {
            userId,
            name: name.trim(),
            email: email.toLowerCase(),
            phone: phone.trim(),
            age: parsedAge,
            gender,
            clinicId: null,
          },
        });
        return { patientId: updated.id };
      }

      // Create new patient profile (upsert guards against a concurrent
      // registration racing on the unique userId).
      const patient = await tx.patient.upsert({
        where: { userId },
        create: {
          userId,
          name: name.trim(),
          email: email.toLowerCase(),
          phone: phone.trim(),
          age: parsedAge,
          gender,
          clinicId: null,
          role: 'PATIENT',
        },
        update: {
          name: name.trim(),
          email: email.toLowerCase(),
          phone: phone.trim(),
          age: parsedAge,
          gender,
        },
      });
      return { patientId: patient.id };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('API register-patient error:', error);
    return NextResponse.json({ error: error instanceof Error ? (error.message || 'Database registration failure') : String(error) }, { status: 500 });
  }
}