import { NextResponse } from 'next/server';
import { getSessionFromRequest } from './session';
import type { SessionPayload } from './session';

export type { SessionPayload } from './session';

export type Role = 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN';

function unauthorized(message = 'Authentication required'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message = 'You do not have permission to perform this action'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Requires a valid (signed, non-expired) session cookie.
 * Returns { session } on success or a 401 NextResponse on failure.
 */
export function requireAuth(
  request: Request
): { session: SessionPayload } | NextResponse {
  const session = getSessionFromRequest(request);
  if (!session) return unauthorized();
  return { session };
}

/**
 * Requires an authenticated session whose role is in the allowed set.
 * Returns { session } on success or a 401/403 NextResponse on failure.
 */
export function requireRole(
  request: Request,
  allowedRoles: Role[]
): { session: SessionPayload } | NextResponse {
  const result = requireAuth(request);
  if (result instanceof NextResponse) return result;

  if (!allowedRoles.includes(result.session.role as Role)) {
    return forbidden();
  }
  return result;
}

/**
 * Requires a session and that the target clinicId (if supplied) matches
 * the session's clinic. SUPER_ADMIN is allowed to act on any clinic.
 */
export function requireClinicAccess(
  request: Request,
  allowedRoles: Role[],
  clinicId?: string | null
): { session: SessionPayload } | NextResponse {
  const result = requireRole(request, allowedRoles);
  if (result instanceof NextResponse) return result;

  const { session } = result;
  if (session.role === 'SUPER_ADMIN') return result;

  if (clinicId && session.clinicId && clinicId !== session.clinicId) {
    return forbidden('You do not have access to this clinic');
  }
  return result;
}

/**
 * True when the session may operate on the given clinic: SUPER_ADMIN can
 * operate on any clinic, every other role is restricted to their own clinic.
 */
export function sessionHasClinicAccess(session: SessionPayload, clinicId?: string | null): boolean {
  if (session.role === 'SUPER_ADMIN') return true;
  return !!clinicId && !!session.clinicId && session.clinicId === clinicId;
}

/**
 * Requires an authenticated staff member (non-PATIENT) and returns their
 * session only when the requested clinic matches their own (or they are
 * a SUPER_ADMIN). Convenience wrapper for clinic-scoped APIs.
 */
export function requireStaffClinicAccess(
  request: Request,
  allowedRoles: Role[],
  clinicId?: string | null
): { session: SessionPayload } | NextResponse {
  const result = requireRole(request, allowedRoles);
  if (result instanceof NextResponse) return result;

  if (!sessionHasClinicAccess(result.session, clinicId)) {
    return forbidden('You do not have access to this clinic');
  }
  return result;
}