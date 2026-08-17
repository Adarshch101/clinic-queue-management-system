'use client';

import React, { useState } from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/features/auth/services/authService';
import { validateEmail } from '@/features/auth/validators/authValidators';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setGeneralError(null);

    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setGeneralError(err instanceof Error ? err.message : String(err) || 'Failed to dispatch reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email to receive a secure password reset link"
    >
      {success ? (
        <div className="flex flex-col gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-success-muted border border-success/20 text-success flex items-center justify-center mx-auto shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-xs text-text-secondary leading-relaxed font-semibold">
            We have emailed a secure reset link to <strong>{email}</strong>. Please check your inbox.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Back to Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {generalError && (
            <div className="p-3.5 rounded-xl bg-danger-muted border border-danger/25 text-danger text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{generalError}</span>
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="you@clinic.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            error={emailError || undefined}
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
            Send Reset Link
          </Button>

          <div className="text-center text-[11px] text-text-secondary font-semibold mt-2">
            Remember your credentials? <Link href="/login" className="text-primary font-bold hover:underline">Log In</Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
