'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context/AuthContext';

export type GuardRole = 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN';

interface RoleGuardProps {
  roles: GuardRole[];
  children: React.ReactNode;
}

/**
 * Frontend route guard: renders children only when the authenticated profile
 * carries one of the allowed roles. Unauthenticated users are redirected to
 * the login page; authenticated users with a different role are redirected to
 * the access-denied page. This is a UX/defense-in-depth layer — every API
 * route enforces the same roles server-side.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ roles, children }) => {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      router.replace('/login');
    } else if (!roles.includes(profile.role)) {
      router.replace('/auth/denied');
    }
  }, [loading, profile, roles, router]);

  if (loading || !profile || !roles.includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3 text-xs font-bold text-text-muted animate-pulse">
          <span className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 border-t-transparent animate-spin" />
          <span>Verifying access permissions...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
