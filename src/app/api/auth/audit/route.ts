import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/session';

// Pre-authentication events may be logged without a session, but they are
// forced to the 'anonymous' actor and limited to a strict allowlist so the
// audit trail cannot be forged with arbitrary roles or clinics.
const ANONYMOUS_ALLOWLIST = new Set(['FAILED_LOGIN', 'PASSWORD_RESET_REQUEST']);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, action, details, clinicId: inputClinicId } = body;

    if (!userId || !action || !details) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const session = getSessionFromRequest(request);

    // Authenticated path: the actor is derived server-side from the session.
    // Client-supplied userId / clinicId are ignored to prevent impersonation.
    if (session) {
      let resolvedClinicId: string | undefined = inputClinicId;

      // Only SUPER_ADMIN may attach logs to a clinic they are not scoped to.
      // A non-SUPER_ADMIN without a clinicId (e.g. a patient) must not be able
      // to attribute audit entries to an arbitrary clinic.
      if (session.role !== 'SUPER_ADMIN') {
        if (session.clinicId) {
          if (inputClinicId && inputClinicId !== session.clinicId) {
            return NextResponse.json({ error: 'You do not have access to this clinic' }, { status: 403 });
          }
          resolvedClinicId = session.clinicId;
        } else {
          resolvedClinicId = undefined;
        }
      }

      const log = await prisma.auditLog.create({
        data: {
          clinicId: resolvedClinicId || 'global',
          userId: session.userId,
          userRole: session.role as Role,
          action,
          details,
          ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        },
      });

      return NextResponse.json({ success: true, logId: log.id });
    }

    // Anonymous path: only allow-list actions, forced to 'anonymous' actor.
    if (!ANONYMOUS_ALLOWLIST.has(action) || userId !== 'anonymous') {
      return NextResponse.json(
        { error: 'Authentication is required to write audit entries' },
        { status: 401 }
      );
    }

    const log = await prisma.auditLog.create({
      data: {
        clinicId: inputClinicId || 'global',
        userId: 'anonymous',
        userRole: 'PATIENT',
        action,
        details,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    return NextResponse.json({ success: true, logId: log.id });
  } catch (error) {
    console.error('API audit log error:', error);
    return NextResponse.json({ error: error instanceof Error ? (error.message || 'Audit log write failure') : String(error) }, { status: 500 });
  }
}