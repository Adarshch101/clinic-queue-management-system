'use client';

import React from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';

export default function TermsPage() {
  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Terms of Service</h1>
          <p className="text-text-secondary">
            These Terms of Service ("Terms") govern your use of the Q-Clinix platform. By accessing or using the platform, you agree to be bound by these Terms.
          </p>
        </div>

        <div className="space-y-6 text-text-secondary text-sm leading-relaxed">
          <h2 className="text-2xl font-black text-text-primary tracking-tight">Acceptance of Terms</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            By using the Q-Clinix platform, you represent that you are at least 18 years of age or have legal capacity to enter into this agreement.
          </p>

          <h2 className="text-2xl font-black text-text-primary tracking-tight">Platform Use</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>You agree to use the platform only for lawful purposes</li>
            <li>You must not modify, reproduce, or distribute any platform content without permission</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
          </ul>

          <h2 className="text-2xl font-black text-text-primary tracking-tight">Clinic Responsibilities</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Clinics are responsible for ensuring compliance with all applicable healthcare regulations</li>
            <li>Clinics must maintain accurate patient records and queue data</li>
            <li>Clinics are responsible for managing patient consent and privacy preferences</li>
          </ul>

          <h2 className="text-2xl font-black text-text-primary tracking-tight">Limitation of Liability</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            Q-Clinix provides the platform on an "as is" basis without warranties of any kind, either express or implied.
          </p>

          <h2 className="text-2xl font-black text-text-primary tracking-tight">Changes to Terms</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            We reserve the right to modify these Terms at any time. Changes will be effective upon posting the revised Terms on this page.
          </p>

          <div className="pt-6 border-t border-border-subtle/50">
            <h2 className="text-2xl font-black text-text-primary tracking-tight">Last Updated</h2>
            <p className="text-text-secondary">
              These terms of service were last updated in January 2026.
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}