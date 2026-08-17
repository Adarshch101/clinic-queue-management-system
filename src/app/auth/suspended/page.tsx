'use client';

import React from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/Button';
import { AlertOctagon, Mail, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';

export default function SuspendedClinic() {
  const { logout } = useAuth();

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-full bg-danger-muted border border-danger/25 text-danger flex items-center justify-center shadow-sm shrink-0">
          <AlertOctagon className="w-8 h-8 animate-bounce" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Account Suspended</h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
            Your clinic account has been suspended due to billing delays or policy violations. Access to your queue management dashboard is temporarily blocked.
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <Button onClick={() => window.location.href = 'mailto:support@q-clinix.com'} variant="primary" className="flex-1">
            <Mail className="w-4 h-4 shrink-0" /> Resolve Issue
          </Button>
          <Button onClick={logout} variant="outline" className="flex-1">
            <LogOut className="w-4 h-4 shrink-0" /> Log Out
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}
