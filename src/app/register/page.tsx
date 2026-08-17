'use client';

import React from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Register Your Clinic"
      subtitle="Get started on the multi-tenant smart queue ecosystem in minutes"
    >
      <RegisterForm />

      <div className="text-center text-[11px] text-text-secondary font-semibold mt-4">
        Already registered a clinic? <Link href="/login" className="text-primary font-bold hover:underline">Log In</Link>
      </div>
    </AuthLayout>
  );
}
