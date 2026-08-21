'use client';

import React, { useState } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !msg) return;
    setSent(true);
    setName('');
    setEmail('');
    setMsg('');
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-10">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Contact Us</h1>
          <p className="text-text-secondary">
            Have questions about clinic setup, pricing plans, or compliance policies? Reach out.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Details */}
          <div className="flex flex-col gap-6 justify-center">
            <h2 className="text-lg font-black text-text-primary tracking-tight">Get in Touch</h2>
            <p className="text-text-secondary font-medium leading-relaxed max-w-sm">
              Our team is available to assist you with integrations, multi-clinic setups, and billing audits.
            </p>

            <div className="flex flex-col gap-4 text-xs font-semibold text-text-secondary mt-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4.5 h-4.5 text-primary shrink-0" />
                <span>support@q-clinix.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4.5 h-4.5 text-primary shrink-0" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4.5 h-4.5 text-primary shrink-0" />
                <span>742 Evergreen Terrace, Springfield</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <Card className="flex flex-col gap-4 lg:w-full">
            <h3 className="font-extrabold text-sm text-text-primary">Send a Message</h3>

            {sent ? (
              <div className="py-4 px-3 rounded-xl bg-emerald-100 text-emerald-600 text-xs font-bold text-center">
                ✓ Message sent successfully! We will get back to you shortly.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Your Name"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Input
                  label="Email Address"
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Textarea
                  label="Message Detail"
                  rows={4}
                  required
                  placeholder="How can we help your clinic branch?"
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                />

                <Button type="submit" variant="primary" className="mt-2">
                  Submit Form
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}