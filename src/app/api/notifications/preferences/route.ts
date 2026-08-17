import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const userId = session.userId;

    let pref = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!pref) {
      pref = await prisma.notificationPreference.create({
        data: {
          userId,
          emailEnabled: true,
          smsEnabled: false,
          whatsappEnabled: false,
          browserEnabled: true,
          pushEnabled: false,
        },
      });
    }

    return NextResponse.json(pref);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { emailEnabled, smsEnabled, whatsappEnabled, browserEnabled, pushEnabled, quietHoursStart, quietHoursEnd } = await request.json();

    const pref = await prisma.notificationPreference.upsert({
      where: { userId: session.userId },
      update: {
        emailEnabled,
        smsEnabled,
        whatsappEnabled,
        browserEnabled,
        pushEnabled,
        quietHoursStart,
        quietHoursEnd,
      },
      create: {
        userId: session.userId,
        emailEnabled,
        smsEnabled,
        whatsappEnabled,
        browserEnabled,
        pushEnabled,
        quietHoursStart,
        quietHoursEnd,
      },
    });

    return NextResponse.json(pref);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}