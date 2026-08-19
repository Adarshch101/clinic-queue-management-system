import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const userId = session.userId;

    const preferences = await prisma.widgetPreference.findMany({
      where: { userId }
    });

    const layout = await prisma.dashboardLayout.findUnique({
      where: { userId }
    });

    return NextResponse.json({
      preferences,
      layout: layout ? JSON.parse(layout.layout) : null
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { widgetId, visible, favorite, layout } = await request.json();
    const userId = session.userId;

    // 1. If updating full layout order
    if (layout) {
      const updatedLayout = await prisma.dashboardLayout.upsert({
        where: { userId },
        update: { layout: JSON.stringify(layout) },
        create: { userId, layout: JSON.stringify(layout) }
      });
      return NextResponse.json({ success: true, layout: updatedLayout });
    }

    // 2. If updating individual widget preference
    if (!widgetId) {
      return NextResponse.json({ error: 'Missing widgetId parameter' }, { status: 400 });
    }

    const pref = await prisma.widgetPreference.upsert({
      where: {
        userId_widgetId: { userId, widgetId }
      },
      update: {
        visible: visible !== undefined ? visible : true,
        favorite: favorite !== undefined ? favorite : false
      },
      create: {
        userId,
        widgetId,
        visible: visible !== undefined ? visible : true,
        favorite: favorite !== undefined ? favorite : false
      }
    });

    // Write operational audit log
    await prisma.auditLog.create({
      data: {
        clinicId: 'global-platform',
        userId,
        userRole: session.role as 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN',
        action: 'CUSTOMIZE_DASHBOARD',
        details: `Widget ${widgetId} customization modified (visible: ${visible}, favorite: ${favorite})`,
      }
    });

    return NextResponse.json(pref);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}