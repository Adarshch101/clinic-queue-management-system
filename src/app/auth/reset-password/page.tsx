'use client';

import React, { useState } from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/features/auth/services/authService';
import { validatePassword } from '@/features/auth/validators/authValidators';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setGeneralError(null);

    const passErr = validatePassword(password);
    if (passErr) {
      setPasswordError(passErr);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(password);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setGeneralError(err instanceof Error ? err.message : String(err) || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Enter a new strong password for your workspace account"
    >
      {success ? (
        <div className="flex flex-col gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-success-muted border border-success/20 text-success flex items-center justify-center mx-auto shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-xs text-text-secondary leading-relaxed font-semibold">
            Password reset successful! You can now log in using your new credentials.
          </p>
          <Link href="/login">
            <Button variant="primary" className="w-full">
              Log In
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
            label="New Password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            error={passwordError || undefined}
          />

          <Input
            label="Confirm New Password"
            type="password"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
            Save New Password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
