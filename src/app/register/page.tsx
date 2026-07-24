'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ShieldCheck, ArrowLeft, Key, Mail, Building, Plus, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const { setClinicById, setCurrentRole, setCurrentUserById } = useApp();
  const router = useRouter();
  
  const [clinicName, setClinicName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName || !subdomain || !adminName || !adminEmail || !adminPassword) return;

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
      });

      if (error) throw error;

      if (data?.user) {
        // 2. Synchronize Admin and Clinic setup in PostgreSQL
        const syncRes = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            name: adminName,
            email: adminEmail,
            role: 'ADMIN',
            clinicName,
            subdomain,
          }),
        });

        if (!syncRes.ok) {
          throw new Error('Failed to synchronize clinic details with database');
        }

        // 3. Update local state and routing
        setCurrentRole('ADMIN');
        setCurrentUserById('admin');
        
        alert(`Tenant registration successful: ${clinicName} is now registered on subdomain: ${subdomain}.q-clinix.com! Redirecting to Admin dashboard...`);
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(err.message || 'Registration failed. Check password requirements.');
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

      <div className="w-full max-w-lg glass-panel p-8 border-indigo-50/60 dark:border-slate-800 glow-primary bg-white/60 dark:bg-slate-900/60">
        
        {/* Logo and header */}
        <div className="text-center mb-6">
          <span className="text-3xl p-1.5 rounded-2xl bg-indigo-600 text-white font-black leading-none shadow shadow-indigo-500/25 inline-block mb-3">
            Q
          </span>
          <h2 className="text-2xl font-black text-gray-800 dark:text-slate-100 font-sans tracking-tight">Register Your Clinic</h2>
          <p className="text-xs text-gray-500 mt-1">Get started on the multi-tenant smart queue ecosystem in minutes</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-550/10 border border-rose-500/20 text-rose-550 dark:text-rose-455 text-xs font-semibold mb-5 flex items-center gap-2 animate-pulse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Clinic Name</label>
              <div className="relative">
                <Building className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. CareFirst Center"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-250 dark:border-slate-850 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">SaaS Subdomain</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. carefirst"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-250 dark:border-slate-850 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-right pr-24"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-450 font-bold">
                  .q-clinix.com
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-slate-850 my-4 pt-3">
            <div className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Administrative Administrator Account
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Miller"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-250 dark:border-slate-850 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="admin@clinicdomain.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-250 dark:border-slate-850 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Secure Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-250 dark:border-slate-850 bg-white/50 dark:bg-slate-900/50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/10 transition mt-2 flex items-center justify-center gap-1.5 disabled:bg-slate-400"
          >
            {loading ? 'Provisioning...' : <><Plus className="w-4 h-4" /> Provision SaaS Workspace</>}
          </button>
        </form>

        <div className="text-center text-[11px] text-gray-500 mt-6">
          Already registered a clinic? <Link href="/login" className="text-indigo-600 font-bold hover:underline">Log In</Link>
        </div>

      </div>
    </div>
  );
}
