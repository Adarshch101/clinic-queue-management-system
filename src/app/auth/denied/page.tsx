'use client';

import React from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AccessDenied() {
  return (
    <PublicLayout>
      <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-full bg-danger-muted border border-danger/25 text-danger flex items-center justify-center shadow-sm shrink-0">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Access Denied</h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
            You do not possess the required RBAC permissions to view this resource. Contact clinic administration.
          </p>
        </div>

        <Link href="/" className="w-full">
          <Button variant="primary" className="w-full">
            <ArrowLeft className="w-4 h-4 shrink-0" /> Return to Home
          </Button>
        </Link>
      </div>
    </PublicLayout>
  );
}
