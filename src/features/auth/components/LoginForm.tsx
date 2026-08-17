'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { validateEmail } from '../validators/authValidators';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Error/Loading states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setGeneralError(null);

    // Validation
    const mailErr = validateEmail(email);
    if (mailErr) {
      setEmailError(mailErr);
      return;
    }
    if (!password) {
      setGeneralError('Password is required');
      return;
    }

    setLoading(true);
    try {
      const { profile } = await authService.login(email, password);
      await refreshProfile();

      if (profile.role === 'SUPER_ADMIN') {
        router.push('/admin/super-dashboard');
      } else {
        router.push(`/${profile.role.toLowerCase()}/dashboard`);
      }
    } catch (err) {
      console.error('Login submit error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('CLINIC_PENDING')) {
        router.push('/auth/pending');
      } else if (msg.includes('CLINIC_REJECTED')) {
        router.push('/auth/rejected');
      } else if (msg.includes('CLINIC_SUSPENDED')) {
        router.push('/auth/suspended');
      } else {
        setGeneralError(msg || 'Invalid email or password combination');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {generalError && (
        <div className="p-3.5 rounded-xl bg-danger-muted border border-danger/25 text-danger text-xs font-bold flex items-center gap-2 animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      <Input
        label="Email Address"
        type="email"
        required
        placeholder="you@clinicdomain.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (emailError) setEmailError(null);
        }}
        error={emailError || undefined}
      />

      <div className="relative w-full">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 top-[38px] text-text-muted hover:text-text-primary transition focus:outline-none"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex justify-between items-center text-[10px] text-text-secondary font-bold pt-1">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-border-subtle text-primary focus:ring-primary-glow"
          />
          <span>Remember me</span>
        </label>
        <button
          type="button"
          onClick={() => router.push('/auth/forgot-password')}
          className="hover:underline text-primary bg-transparent border-0 font-bold"
        >
          Forgot Password?
        </button>
      </div>

      <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
        Authenticate Credentials
      </Button>
    </form>
  );
};
