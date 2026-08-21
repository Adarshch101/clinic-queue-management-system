'use client';

import React from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Privacy Policy</h1>
          <p className="text-text-secondary">
            Q-Clinix is committed to protecting your privacy. This policy explains how we collect, use, disclose, and safeguard your information.
          </p>
        </div>

        <div className="space-y-6 text-text-secondary text-sm leading-relaxed">
          <h2 className="text-2xl font-black text-text-primary tracking-tight">Information We Collect</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Personal information (name, email, phone number) provided during check-in</li>
            <li>Clinic information and configuration details</li>
            <li>Queue token and consultation data</li>
            <li>Device and browsing information</li>
          </ul>

          <h2 className="text-2xl font-black text-text-primary tracking-tight">How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>To manage queue operations and patient check-ins</li>
            <li>To provide real-time wait time estimates</li>
            <li>To communicate with patients regarding their queue position</li>
            <li>For clinic operational analytics and improvements</li>
          </ul>

          <h2 className="text-2xl font-black text-text-primary tracking-tight">Data Security</h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            We implement appropriate data security measures to protect your information from unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2 className="text-2xl font-black text-text-primary tracking-tight">Your Rights</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Access and review your personal information</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
          </ul>

          <div className="pt-6 border-t border-border-subtle/50">
            <h2 className="text-2xl font-black text-text-primary tracking-tight">Last Updated</h2>
            <p className="text-text-secondary">
              This privacy policy was last updated in January 2026.
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}