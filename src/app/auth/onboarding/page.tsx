'use client';

import React from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { OnboardingWizard } from '@/features/clinics/onboarding/components/OnboardingWizard';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingPage() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center p-20 gap-4 text-xs text-text-secondary">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <span>Verifying authentication state...</span>
        </div>
      </PublicLayout>
    );
  }

  const isAuthorized = user && profile && (profile.role === 'ADMIN' || profile.role === 'SUPER_ADMIN') && !!profile.clinicId;
  const clinicId = profile?.clinicId || '';

  if (!isAuthorized) {
    return (
      <PublicLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 rounded-full bg-danger-muted border border-danger/25 text-danger flex items-center justify-center shadow-sm shrink-0">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-black text-text-primary tracking-tight">Onboarding Locked</h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
              Only registered clinic owners and administrators can complete onboarding profiles. Please authenticate with a clinic owner account.
            </p>
          </div>

          <Link href="/login" className="w-full">
            <Button variant="primary" className="w-full">
              Proceed to Login
            </Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-primary">Clinic Registration Onboarding</h1>
          <p className="text-sm text-text-secondary mt-1">
            Complete all onboarding profile steps and upload certificates to verify your clinic.
          </p>
        </div>
        <OnboardingWizard clinicId={clinicId} />
      </div>
    </PublicLayout>
  );
}
