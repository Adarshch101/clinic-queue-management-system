'use client';

import React from 'react';
import Link from 'next/link';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/Button';
import { ShieldAlert } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <PublicLayout>
      <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-full bg-danger-muted border border-danger/25 text-danger flex items-center justify-center shadow-sm shrink-0">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-text-primary tracking-tight">404 - Page Not Found</h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
            The page you are looking for does not exist or has been relocated to another subdomain.
          </p>
        </div>

        <Link href="/">
          <Button variant="primary">
            Return to Homepage
          </Button>
        </Link>
      </div>
    </PublicLayout>
  );
}
