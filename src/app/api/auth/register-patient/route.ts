import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
      name,
      email,
      phone,
      age,
      gender,
    } = body;

    if (!userId || !name || !email || !phone) {
      return NextResponse.json({ error: 'Missing required registration parameters' }, { status: 400 });
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

    // Check if email already has a patient profile
    const existingPatient = await prisma.patient.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingPatient && existingPatient.userId) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Create patient profile with nullable clinicId (general user registration)
    const result = await prisma.$transaction(async (tx) => {
      // If there's an existing walk-in patient row with this email (no userId), link it
      if (existingPatient && !existingPatient.userId) {
        const updated = await tx.patient.update({
          where: { id: existingPatient.id },
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

      // Create new patient profile
      const patient = await tx.patient.create({
        data: {
          userId,
          name: name.trim(),
          email: email.toLowerCase(),
          phone: phone.trim(),
          age: parsedAge,
          gender,
          clinicId: null,
          role: 'PATIENT',
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