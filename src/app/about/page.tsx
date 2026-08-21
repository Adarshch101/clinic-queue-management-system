'use client';

import React from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card } from '@/components/ui/Card';
import { Info, ShieldCheck, HeartPulse, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-text-primary tracking-tight">About Q-Clinix</h1>
          <p className="text-text-secondary">
            We build modern digital experiences that optimize medical operations and respect patient timelines.
          </p>
        </div>

        <div className="space-y-6 text-text-secondary text-sm leading-relaxed font-medium">
          <p>
            Founded with a vision to eliminate the chaotic, stressful environments of traditional healthcare waiting rooms, Q-Clinix digitizes the queue experience for both practitioners and patients.
          </p>
          <p>
            By integrating real-time telemetry boards, walk-in register terminals, automated check-in kiosks, and predictive scheduling tools, our SaaS platform streamlines clinic workflows, saves medical hours, and gives patients back control over their schedules.
          </p>
        </div>

        {/* Value Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex flex-col gap-3">
            <Info className="w-6 h-6 text-primary shrink-0" />
            <div>
              <h4 className="font-extrabold text-text-primary">Patient-First Care</h4>
              <p className="text-text-secondary font-medium leading-relaxed">
                Respecting patient time and reducing anxiety through wait-time transparency.
              </p>
            </div>
          </Card>
          
          <Card className="flex flex-col gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
            <div>
              <h4 className="font-extrabold text-text-primary">HIPAA Secure</h4>
              <p className="text-text-secondary font-medium leading-relaxed">
                Ensuring complete record isolation and security compliance at every workflow step.
              </p>
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <Sparkles className="w-6 h-6 text-violet-500 shrink-0" />
            <div>
              <h4 className="font-extrabold text-text-primary">AI Insights</h4>
              <p className="text-text-secondary font-medium leading-relaxed">
                Forecasting surges and optimization ratios to better coordinate shifts.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}