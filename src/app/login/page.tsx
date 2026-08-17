'use client';

import React from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginForm } from '@/features/auth/components/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <AuthLayout 
      title="Access Your Workspace" 
      subtitle="Log in to manage your medical queue tickets"
    >
      {/* Credentials Form */}
      <LoginForm />

      <div className="text-center text-[11px] text-text-secondary font-semibold mt-4">
        Don&apos;t have a clinic account? <Link href="/register" className="text-primary font-bold hover:underline">Register Clinic</Link>
      </div>
    </AuthLayout>
  );
}
