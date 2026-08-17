'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-bg-base text-text-primary overflow-hidden">
      {/* Left Column: Split Graphic Screen */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-tr from-primary to-indigo-900 text-white relative overflow-hidden">
        {/* Abstract glowing patterns */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        
        {/* Header brand link */}
        <Link href="/" className="flex items-center gap-2 relative z-10 w-fit">
          <span className="text-2xl px-2.5 py-1 rounded-xl bg-white text-primary font-black leading-none">
            Q
          </span>
          <span className="font-extrabold text-lg tracking-tight">Q-Clinix</span>
        </Link>

        {/* Big quote/headline details */}
        <div className="relative z-10 my-auto max-w-md">
          <span className="text-xs uppercase font-extrabold tracking-wider bg-white/10 px-3 py-1 rounded-full">
            Modern Patient Flow
          </span>
          <h1 className="text-4xl font-extrabold mt-6 leading-tight tracking-tight">
            Coordinate waiting halls, consult doctors, and optimize telemetry.
          </h1>
          <p className="text-sm text-indigo-100 mt-4 leading-relaxed font-normal">
            Join hundreds of modern clinics migrating to AI-driven wait list telemetry and real-time check-in kiosks.
          </p>
        </div>

        {/* Footer info */}
        <div className="text-[10px] text-indigo-200 relative z-10">
          © 2026 Q-Clinix Inc. HIPAA Compliant Multi-Tenant Queue SaaS.
        </div>
      </div>

      {/* Right Column: Dynamic Form Screen */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-y-auto">
        <Link
          href="/"
          className="absolute top-6 left-6 text-xs font-bold text-text-secondary hover:text-primary flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Home Page
        </Link>

        <div className="w-full max-w-md bg-bg-surface border border-border-subtle shadow-lg rounded-2xl p-6 sm:p-10 flex flex-col gap-6 relative z-10">
          <div className="text-center">
            <h2 className="text-2xl font-black text-text-primary tracking-tight">{title}</h2>
            <p className="text-xs text-text-secondary mt-1">{subtitle}</p>
          </div>

          <div className="flex flex-col gap-4">{children}</div>
        </div>
      </div>
    </div>
  );
};
export default AuthLayout;
