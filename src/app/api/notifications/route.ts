import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientUserId: session.userId },
      orderBy: { sentAt: 'desc' },
    });

    return NextResponse.json(notifications);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { notificationId, markAll } = await request.json();

    if (markAll) {
      await prisma.notification.updateMany({
        where: { recipientUserId: session.userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 });
    }

    const existing = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!existing || existing.recipientUserId !== session.userId) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('notificationId');

    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 });
    }

    const existing = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!existing || existing.recipientUserId !== session.userId) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}