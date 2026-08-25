'use client';

import React, { useEffect, useState } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Clock, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import type { UserSessionProfile } from '@/features/auth/services/authService';

interface ClinicSummary {
  documents: { documentType: string; fileName: string }[];
  doctors: { name: string; registrationNumber: string }[];
  status: string;
}

export default function VerificationPending() {
  const { logout, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clinicId = searchParams.get('clinicId') || '';

  const [clinic, setClinic] = useState<ClinicSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        const res = await fetch(`/api/clinic/${clinicId}`);
        if (res.ok) {
          setClinic(await res.json() as ClinicSummary | null);
        }
      } catch (e) {
        console.error('Failed to fetch clinic:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchClinic();
  }, [clinicId]);

  const handleRefresh = async () => {
    await refreshProfile();
    router.refresh();
    // Re-fetch clinic data after profile refresh
    const fetchClinic = async () => {
      try {
        const res = await fetch(`/api/clinic/${clinicId}`);
        if (res.ok) {
          setClinic(await res.json() as ClinicSummary | null);
        }
      } catch (e) {
        console.error('Failed to fetch clinic:', e);
      }
    };
    fetchClinic();
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center justify-center gap-6">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <span>Loading verification status...</span>
        </div>
      </PublicLayout>
    );
  }

  const hasRequiredDocs = clinic?.documents?.length
    ? clinic.documents.some(
        (d: { documentType: string }) => d.documentType === 'MEDICAL_LICENSE' || d.documentType === 'CLINIC_REGISTRATION'
      )
    : false;
  const hasDoctor = !!clinic?.doctors?.length;
  const clinicStatus = clinic?.status || 'PENDING';

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-full bg-warning-muted border border-warning/25 text-warning flex items-center justify-center shadow-sm shrink-0">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            {clinicStatus === 'PENDING' ? 'Document Verification Pending' : 'Clinic Verification Pending'}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
            {clinicStatus === 'PENDING'
              ? 'Your clinic registration is undergoing administrative review. Our team will verify your licenses and documents shortly.'
              : 'Your clinic documents are being reviewed. Once verified and with at least one doctor added, your clinic will become operational.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="p-3 rounded-xl border border-border-subtle bg-bg-surface text-xs font-semibold text-text-secondary">
            <div className="font-bold text-text-primary">Documents</div>
            <div className="text-[10px] text-text-muted">
              {hasRequiredDocs ? '✓ Clinic Registration + Medical License uploaded' : '✗ Waiting for verification'}
            </div>
          </div>
          <div className="p-3 rounded-xl border border-border-subtle bg-bg-surface text-xs font-semibold text-text-secondary">
            <div className="font-bold text-text-primary">Doctors</div>
            <div className="text-[10px] text-text-muted">
              {hasDoctor ? `✓ ${clinic?.doctors?.length} doctor${clinic?.doctors?.length !== 1 ? 's' : ''} added` : '✗ Waiting for doctor addition'}
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full mt-6">
          <Button onClick={handleRefresh} variant="primary" className="flex-1">
            <RefreshCw className="w-4 h-4 shrink-0" /> Check Status
          </Button>
          <Button onClick={logout} variant="outline" className="flex-1">
            <LogOut className="w-4 h-4 shrink-0" /> Log Out
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}