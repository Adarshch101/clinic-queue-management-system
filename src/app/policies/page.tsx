'use client';

import React from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/Accordion';
import { Badge } from '@/components/ui/Badge';
import { ChevronDownIcon, ShieldCheck, GraduationCap, Rocket } from 'lucide-react';

export default function PoliciesPage() {
  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Policies</h1>
          <p className="text-text-secondary">
            Guidelines and compliance standards for our platform
          </p>
        </div>

        <div className="space-y-6">
          {/* Data Privacy Policy */}
          <Accordion type="single" collapsible>
            <AccordionItem value="privacy">
              <AccordionTrigger className="flex items-center justify-between py-4 px-6 text-left font-medium text-text-primary">
                <span>Data Privacy Policy</span>
                <ChevronDownIcon className="w-4 h-4 opacity-50 transition-transform" />
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 text-text-secondary text-sm leading-relaxed">
                <p>
                  Q-Clinix is committed to protecting your privacy. We collect, use, and disclose
                  personal information in accordance with applicable data protection laws and regulations.
                  Our privacy practices are designed to safeguard your data throughout your interaction
                  with our platform.
                </p>
                <Badge
                  variant="outline"
                  className="mt-2 text-xs text-primary bg-primary/10 border border-primary/20"
                >
                  Last updated: January 2026
                </Badge>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="terms">
              <AccordionTrigger className="flex items-center justify-between py-4 px-6 text-left font-medium text-text-primary">
                <span>Terms of Service</span>
                <ChevronDownIcon className="w-4 h-4 opacity-50 transition-transform" />
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 text-text-secondary text-sm leading-relaxed">
                <p>
                  By accessing and using the Q-Clinix platform, you agree to comply with these Terms of
                  Service, which govern your relationship with us. Please review them carefully.
                </p>
                <Badge
                  variant="outline"
                  className="mt-2 text-xs text-primary bg-primary/10 border border-primary/20"
                >
                  Last updated: January 2026
                </Badge>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="hipaa">
              <AccordionTrigger className="flex items-center justify-between py-4 px-6 text-left font-medium text-text-primary">
                <span>HIPAA Compliance</span>
                <ChevronDownIcon className="w-4 h-4 opacity-50 transition-transform" />
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 text-text-secondary text-sm leading-relaxed">
                <p>
                  Q-Clinix maintains full HIPAA compliance to ensure the privacy, integrity, and
                  security of all protected health information (PHI). All data is encrypted at rest
                  and in transit, with access controls and audit trails enforced at every workflow step.
                </p>
                <Badge
                  variant="outline"
                  className="mt-2 text-xs text-primary bg-primary/10 border border-primary/20"
                >
                  Last updated: January 2026
                </Badge>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cookie">
              <AccordionTrigger className="flex items-center justify-between py-4 px-6 text-left font-medium text-text-primary">
                <span>Cookie Policy</span>
                <ChevronDownIcon className="w-4 h-4 opacity-50 transition-transform" />
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 text-text-secondary text-sm leading-relaxed">
                <p>
                  We use cookies and similar tracking technologies to enhance your experience, analyze
                  site traffic, and personalize content. You can manage cookie preferences through your
                  browser settings.
                </p>
                <Badge
                  variant="outline"
                  className="mt-2 text-xs text-primary bg-primary/10 border border-primary/20"
                >
                  Last updated: January 2026
                </Badge>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="accessibility">
              <AccordionTrigger className="flex items-center justify-between py-4 px-6 text-left font-medium text-text-primary">
                <span>Accessibility Statement</span>
                <ChevronDownIcon className="w-4 h-4 opacity-50 transition-transform" />
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 text-text-secondary text-sm leading-relaxed">
                <p>
                  Q-Clinix is committed to ensuring digital accessibility for people with disabilities.
                  We continuously improve the user experience and apply relevant accessibility standards
                  to make our platform usable by everyone.
                </p>
                <Badge
                  variant="outline"
                  className="mt-2 text-xs text-primary bg-primary/10 border border-primary/20"
                >
                  Last updated: January 2026
                </Badge>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Compliance Section */}
          <div className="pt-6 border-t border-border-subtle/50 mb-6">
            <h2 className="text-2xl font-black text-text-primary tracking-tight mb-6">Compliance & Security</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-background rounded-xl border border-border hover:border-emerald-500 transition-colors">
                <Badge className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 mb-4 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </Badge>
                <h4 className="font-extrabold text-text-primary mb-2">Data Security</h4>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Enterprise-grade encryption and access controls protect all patient and clinic data.
                </p>
              </div>

              <div className="p-6 bg-background rounded-xl border border-border hover:border-emerald-500 transition-colors">
                <Badge className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 mb-4 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </Badge>
                <h4 className="font-extrabold text-text-primary mb-2">Regulatory Compliance</h4>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Compliant with HIPAA, GDPR, and other regional healthcare regulations.
                </p>
              </div>

              <div className="p-6 bg-background rounded-xl border border-border hover:border-emerald-500 transition-colors">
                <Badge className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 mb-4 flex items-center justify-center">
                  <Rocket className="w-4 h-4" />
                </Badge>
                <h4 className="font-extrabold text-text-primary mb-2">Audit & Monitoring</h4>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Comprehensive audit logs and real-time monitoring ensure full transparency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}