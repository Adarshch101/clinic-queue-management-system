import { AppError } from '../errors/AppError';
import { UserSessionProfile } from '@/features/auth/services/authService';

export function authorizeRole(allowedRoles: ('PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN')[], sessionProfile: UserSessionProfile | null) {
  if (!sessionProfile) {
    throw new AppError('Authentication credentials are required', 401);
  }

  if (!allowedRoles.includes(sessionProfile.role)) {
    throw new AppError('Access forbidden: insufficient privilege scopes', 403);
  }
}

export function authorizeClinicScope(clinicId: string, sessionProfile: UserSessionProfile | null) {
  if (!sessionProfile) {
    throw new AppError('Authentication credentials are required', 401);
  }

  // Super Admin bypass
  if (sessionProfile.role === 'SUPER_ADMIN') return;

  if (sessionProfile.clinicId !== clinicId) {
    throw new AppError('Access forbidden: request is out of clinic boundary scope', 403);
  }
}
