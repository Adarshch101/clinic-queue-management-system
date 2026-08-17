'use client';

import React from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PatientRegisterForm } from '@/features/auth/components/PatientRegisterForm';
import NextLink from 'next/link';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

export default function PatientRegisterPage() {
  return (
    <AuthLayout
      title="Create Your Patient Account"
      subtitle="Join the queue, track your position, and manage your healthcare visits"
    >
      <PatientRegisterForm />

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1, fontWeight: 600 }}>
        Already have an account?{' '}
        <Link component={NextLink} href="/login" sx={{ fontWeight: 800 }}>
          Log In
        </Link>
      </Typography>
    </AuthLayout>
  );
}