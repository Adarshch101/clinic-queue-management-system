'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/dashboard/Header';
import { 
  ArrowRight, 
  Clock, 
  Smartphone, 
  Users, 
  Tv, 
  Bot, 
  ShieldCheck, 
  Sparkles,
  Layers,
  HeartPulse,
  ChevronRight,
  Database,
  MonitorPlay,
  Calendar,
  MessageSquare,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { currentRole, setCurrentRole, setCurrentUserById } = useApp();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const features = [
    {
      icon: <Smartphone className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      title: "QR Check-In Kiosk",
      description: "Patients check in by scanning a unique QR code. Automates token generation and alerts staff instantly."
    },
    {
      icon: <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      title: "Live Queue Status",
      description: "Real-time updates of queue positions, estimated wait times, and serving room indicators via WebSockets."
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      title: "Walk-In Registrations",
      description: "Fast-track tablet inputs for walk-in patient profiles. Generates physical and digital token slips."
    },
    {
      icon: <Bot className="w-6 h-6 text-violet-600 dark:text-violet-400" />,
      title: "AI Optimization",
      description: "Predictive algorithms forecasting patient arrival surges, consultation duration, and no-show probabilities."
    },
    {
      icon: <Tv className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
      title: "TV Waiting Room Display",
      description: "High-contrast visual boards with voice synthetic ticket announcements to coordinate waiting halls."
    },
    {
      icon: <Layers className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      title: "Multi-Clinic SaaS",
      description: "Run multiple branches or clinics on a unified tenant model. Strict isolated data architectures."
    }
  ];

  const pricingTiers = [
    {
      name: "Starter Clinic",
      price: "$49",
      period: "month",
      description: "Perfect for single practitioner clinics getting digitized.",
      features: [
        "1 Active Doctor Queue",
        "Reception Walk-In Interface",
        "SMS Queue Notifications",
        "Digital Patient Board",
        "Standard QR Check-In"
      ],
      popular: false,
      cta: "Start Free Trial"
    },
    {
      name: "Smart Clinic Pro",
      price: "$129",
      period: "month",
      description: "Ideal for growing clinics with multiple rooms and doctors.",
      features: [
        "Up to 10 Doctor Queues",
        "TV Wait Room Display Mode",
        "Voice synthesizers (Text-To-Speech)",
        "Patient Medical Report Uploads",
        "AI Wait Time Predictions (Beta)",
        "Priority Support"
      ],
      popular: true,
      cta: "Upgrade to Pro"
    },
    {
      name: "Enterprise SaaS",
      price: "$299",
      period: "month",
      description: "For multi-branch medical organizations and hospitals.",
      features: [
        "Unlimited Clinics & Doctors",
        "Fully Brandable Custom Subdomains",
        "Full AI Optimizations Suite",
        "API & Webhook Integrations",
        "Dedicated Server Deployment",
        "SLA & Premium Support"
      ],
      popular: false,
      cta: "Contact Enterprise"
    }
  ];

  const handleLaunchDashboard = (role: 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN') => {
    setCurrentRole(role);
    if (role === 'PATIENT') {
      setCurrentUserById('pat-1');
    } else if (role === 'RECEPTIONIST') {
      setCurrentUserById('receptionist');
    } else if (role === 'DOCTOR') {
      setCurrentUserById('doc-1');
    } else if (role === 'ADMIN') {
      setCurrentUserById('admin');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-24 border-b border-gray-100 dark:border-slate-800/40">
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-400/10 dark:bg-sky-500/5 blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[250px] h-[250px] rounded-full bg-indigo-400/10 dark:bg-indigo-500/5 blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-blue-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-50/50 dark:border-blue-900/30 mb-6 shadow-sm">
            <HeartPulse className="w-3.5 h-3.5" /> Introducing Q-Clinix SaaS Version 2.0
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            The Smart, AI-Ready{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-indigo-500 bg-clip-text text-transparent">
              Queue Experience
            </span>{" "}
            for Modern Medical Clinics
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl text-gray-500 dark:text-slate-400 max-w-2xl mx-auto font-normal">
            Eliminate chaotic waiting rooms, optimize doctor consultations, and provide patients with real-time wait telemetry. Built for multi-tenant SaaS growth.
          </p>

          {/* Quick Demo Dashboard Access Panel */}
          <div className="mt-10 max-w-3xl mx-auto p-6 glass-panel border-indigo-50/60 dark:border-slate-800 glow-primary">
            <div className="text-xs uppercase font-extrabold tracking-wider text-indigo-600 dark:text-indigo-400 mb-3.5 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Interactive Sandbox Mode
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-5">
              Experience the platform instantly. Choose a simulated portal to see how real-time queues update:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { r: 'PATIENT', path: '/patient/dashboard', label: 'Patient View', color: 'hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-sky-400' },
                { r: 'RECEPTIONIST', path: '/receptionist/dashboard', label: 'Receptionist View', color: 'hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400' },
                { r: 'DOCTOR', path: '/doctor/dashboard', label: 'Doctor View', color: 'hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400' },
                { r: 'ADMIN', path: '/admin/dashboard', label: 'Admin View', color: 'hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400' },
              ].map((role) => (
                <Link
                  key={role.r}
                  href={role.path}
                  onClick={() => handleLaunchDashboard(role.r as any)}
                  className={`px-3 py-3 rounded-xl border border-gray-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-xs font-semibold text-gray-700 dark:text-slate-300 shadow-sm flex flex-col items-center justify-center gap-1.5 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 ${role.color}`}
                >
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  {role.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link 
              href="/patient/dashboard"
              onClick={() => handleLaunchDashboard('PATIENT')}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 transition flex items-center gap-2"
            >
              Launch Patient App <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/tv-display"
              target="_blank"
              className="px-6 py-3 rounded-xl text-sm font-semibold border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 transition flex items-center gap-2"
            >
              <MonitorPlay className="w-4 h-4 text-indigo-500" /> Open TV Display
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grids */}
      <section className="py-20 bg-gray-50/50 dark:bg-slate-900/20" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100 sm:text-4xl">
              Clinic Operations, Reimagined
            </h2>
            <p className="mt-4 text-base text-gray-500 dark:text-slate-400">
              A comprehensive suite built with clinic staff, patients, and physicians in mind. Configurable for single medical centers or nationwide healthcare chains.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, index) => (
              <div key={index} className="p-6 glass-panel glass-panel-hover flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-slate-800/80 flex items-center justify-center shadow-sm">
                  {feat.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-slate-100">{feat.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Readiness Showcase */}
      <section className="py-20 border-t border-b border-gray-100 dark:border-slate-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            
            <div className="mb-12 lg:mb-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 mb-4">
                <Bot className="w-3.5 h-3.5" /> Next-Gen AI Telemetry
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 sm:text-4xl leading-tight">
                AI Queue Optimization & Smart Flow Predictions
              </h2>
              <p className="mt-4 text-base text-gray-500 dark:text-slate-400 leading-relaxed">
                Q-Clinix is built with intelligence at its core. By analyzing patient registration timestamps, clinic check-in logs, average doctor check-up schedules, and historical seasonal clinic volume data, our AI engine forecasts:
              </p>
              
              <ul className="mt-6 space-y-3.5">
                {[
                  "Dynamic wait time adjusts based on doctor check-up speed.",
                  "Surge prediction warning staff 24 hours prior to peak hours.",
                  "Predictive analysis flagging potential client no-shows.",
                  "Clinical emergency path optimizations."
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-slate-350">
                    <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel p-6 border-indigo-100/60 dark:border-slate-800 glow-primary bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">🤖</span>
                  <div>
                    <div className="text-xs font-bold uppercase text-gray-400">AI Intelligence Core</div>
                    <div className="text-sm font-bold">Predictive Wait Board</div>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-full">Active</span>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-gray-150 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-500">Wait-Time Prediction Confidence</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">94.2%</span>
                  </div>
                  <div className="w-full bg-gray-250 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-violet-600 h-full rounded-full w-[94.2%]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-gray-150 dark:border-slate-800">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Today's Peak Hour</div>
                    <div className="text-base font-extrabold text-rose-500 mt-1">11:00 AM - 12:30 PM</div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-gray-150 dark:border-slate-800">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Avg. consultation Time</div>
                    <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">11.4 minutes</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex gap-3">
                  <div className="text-lg">💡</div>
                  <div>
                    <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300">AI Staffing Optimization Tip</div>
                    <div className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5">
                      Forecast predicts 1.5x walk-in surge tomorrow between 2-4 PM. We recommend scheduling Dr. Chen for support.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-20" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100 sm:text-4xl">
              Flexible Multi-Clinic Pricing Plans
            </h2>
            <p className="mt-4 text-base text-gray-500 dark:text-slate-400">
              Upgrade or downgrade at any time. Scale features based on your healthcare branch volume.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <div 
                key={index} 
                className={`p-8 glass-panel relative flex flex-col justify-between ${tier.popular ? 'border-indigo-500/60 dark:border-blue-600 glow-primary bg-gradient-to-b from-blue-50/10 to-white dark:from-slate-900' : ''}`}
              >
                {tier.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="font-extrabold text-xl text-gray-800 dark:text-slate-100">{tier.name}</h3>
                  <p className="mt-2 text-xs text-gray-400 leading-normal">{tier.description}</p>
                  
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-slate-100">{tier.price}</span>
                    <span className="text-sm font-semibold text-gray-400">/{tier.period}</span>
                  </div>

                  <ul className="mt-8 space-y-4 border-t border-gray-100 dark:border-slate-800 pt-6">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-slate-350">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={() => alert(`Simulated subscription: ${tier.name}`)}
                  className={`w-full py-3 rounded-xl mt-8 text-xs font-bold transition-all ${tier.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg shadow-indigo-500/10' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-350 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gray-50/50 dark:bg-slate-900/10 border-t border-gray-100 dark:border-slate-800/40" id="contact">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
            Interested in Q-Clinix SaaS?
          </h2>
          <p className="mt-3 text-base text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
            Leave us your email and we'll schedule a custom demonstration with your hospital administration.
          </p>

          <form 
            onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
            className="mt-8 max-w-md mx-auto flex gap-2"
          >
            {submitted ? (
              <div className="w-full py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> Demonstration request submitted! We will contact you soon.
              </div>
            ) : (
              <>
                <input
                  type="email"
                  required
                  placeholder="Enter clinic work email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-sky-500"
                />
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 transition"
                >
                  Get Quote
                </button>
              </>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-100 dark:border-slate-800/40 bg-white dark:bg-[#060814] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <div>
            © 2026 Q-Clinix Inc. All rights reserved. Made for medical clinics globally.
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-indigo-500">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-indigo-500">Terms of Service</a>
            <span>•</span>
            <a href="#" className="hover:text-indigo-500">HIPAA Compliance</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
