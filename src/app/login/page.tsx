'use client';

import React from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginForm } from '@/features/auth/components/LoginForm';
import NextLink from 'next/link';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';

export default function LoginPage() {
  return (
    <AuthLayout
      title="Access Your Workspace"
      subtitle="Log in to manage your medical queue tickets"
    >
      <LoginForm />

      <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          Don&apos;t have a clinic account?{' '}
          <Link component={NextLink} href="/register" sx={{ fontWeight: 800 }}>
            Register Clinic
          </Link>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          New patient?{' '}
          <Link component={NextLink} href="/register/patient" sx={{ fontWeight: 800 }}>
            Create Patient Account
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
}