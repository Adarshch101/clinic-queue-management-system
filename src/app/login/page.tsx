'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ShieldCheck, ArrowLeft, Key, Mail, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { setCurrentRole, setCurrentUserById } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickLogin = async (role: 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN') => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Direct sandbox authentication shortcut
      setCurrentRole(role);
      if (role === 'PATIENT') {
        setCurrentUserById('pat-1');
        router.push('/patient/dashboard');
      } else if (role === 'RECEPTIONIST') {
        setCurrentUserById('receptionist');
        router.push('/receptionist/dashboard');
      } else if (role === 'DOCTOR') {
        setCurrentUserById('doc-1');
        router.push('/doctor/dashboard');
      } else if (role === 'ADMIN') {
        setCurrentUserById('admin');
        router.push('/admin/dashboard');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        // 2. Resolve role based on domain/email prefix for demo or sync custom profile
        let assumedRole: 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN' = 'PATIENT';
        if (email.includes('doctor')) assumedRole = 'DOCTOR';
        else if (email.includes('reception')) assumedRole = 'RECEPTIONIST';
        else if (email.includes('admin')) assumedRole = 'ADMIN';

        // 3. Sync profile to database
        const syncRes = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            name: data.user.email?.split('@')[0] || 'User',
            email: data.user.email,
            role: assumedRole,
          }),
        });

        if (!syncRes.ok) {
          throw new Error('Failed to sync auth profile with database');
        }

        const syncData = await syncRes.json();

        // 4. Update local Context state and redirect
        setCurrentRole(assumedRole);
        setCurrentUserById(assumedRole === 'PATIENT' ? 'pat-1' : assumedRole === 'DOCTOR' ? 'doc-1' : assumedRole.toLowerCase());
        
        router.push(`/${assumedRole.toLowerCase()}/dashboard`);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Invalid credentials or connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-slate-50 to-blue-50/50 dark:from-slate-950 dark:to-slate-900 justify-center items-center p-6 relative overflow-hidden">
      
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <Link 
        href="/"
        className="absolute top-6 left-6 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-slate-200 flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="w-full max-w-md glass-panel p-8 border-indigo-50/60 dark:border-slate-800 glow-primary bg-white/60 dark:bg-slate-900/60">
        
        {/* Logo and header */}
        <div className="text-center mb-6">
          <span className="text-3xl p-1.5 rounded-2xl bg-indigo-600 text-white font-black leading-none shadow shadow-indigo-500/25 inline-block mb-3">
            Q
          </span>
          <h2 className="text-2xl font-black text-gray-800 dark:text-slate-100">Welcome back!</h2>
          <p className="text-xs text-gray-500 mt-1">Log in to manage your medical queue tickets</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-550/10 border border-rose-500/20 text-rose-550 dark:text-rose-400 text-xs font-semibold mb-5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Sandbox Login Buttons */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-gray-150 dark:border-slate-800 mb-6">
          <div className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Sandbox Quick Bypass
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { r: 'PATIENT', label: 'Patient App' },
              { r: 'RECEPTIONIST', label: 'Reception Portal' },
              { r: 'DOCTOR', label: 'Doctor Suite' },
              { r: 'ADMIN', label: 'Clinic Admin' },
            ].map((role) => (
              <button
                key={role.r}
                onClick={() => handleQuickLogin(role.r as any)}
                disabled={loading}
                className="py-2.5 rounded-lg border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10px] font-bold text-gray-700 dark:text-slate-350 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50/20 active:scale-95 transition"
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="doctor@clinic.com or patient@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-250 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5">Password</label>
            <div className="relative">
              <Key className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-250 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-blue-500" />
              <span>Remember me</span>
            </label>
            <a href="#" className="hover:underline text-indigo-600">Forgot Password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/10 transition mt-2 disabled:bg-slate-400"
          >
            {loading ? 'Authenticating...' : 'Authenticate Credentials'}
          </button>
        </form>

        <div className="text-center text-[11px] text-gray-500 mt-6">
          Don't have a clinic account? <Link href="/register" className="text-indigo-600 font-bold hover:underline">Register Clinic</Link>
        </div>

      </div>
    </div>
  );
}
