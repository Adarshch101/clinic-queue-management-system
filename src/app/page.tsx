'use client';

import React, { useState, useEffect } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card } from '@/components/ui/Card';
import { Accordion } from '@/components/ui/Accordion';
import { SearchPanel } from '@/features/public/components/SearchPanel';
import { ClinicCard, type PublicClinic } from '@/features/public/components/ClinicCard';
import { JoinQueueDialog } from '@/features/public/components/JoinQueueDialog';
import { TokenSuccess, type TokenSuccessData } from '@/features/public/components/TokenSuccess';
import { 
  Clock, Smartphone, Users, Tv, Bot, 
  Layers, Sparkles, Stethoscope
} from 'lucide-react';

interface HomeSearchParams {
  query?: string;
  location?: string;
  pincode?: string;
  openNow?: boolean;
  hasQueue?: boolean;
  clinicType?: string;
  sortBy?: string;
}

export default function Home() {
  // Clinic search list states
  const [clinicsList, setClinicsList] = useState<PublicClinic[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [searchParams, setSearchParams] = useState<HomeSearchParams>({ query: '', sortBy: 'shortest_wait' });

  // Dialog / Modal states
  const [activeJoinClinic, setActiveJoinClinic] = useState<PublicClinic | null>(null);
  const [generatedToken, setGeneratedToken] = useState<TokenSuccessData | null>(null);

  // Fetch clinics based on search/filters
  const fetchClinics = async (params: HomeSearchParams) => {
    setLoadingClinics(true);
    try {
      const queryString = new URLSearchParams({
        query: params.query || '',
        location: params.location || '',
        pincode: params.pincode || '',
        openNow: params.openNow ? 'true' : 'false',
        hasQueue: params.hasQueue ? 'true' : 'false',
        clinicType: params.clinicType || 'All',
        sortBy: params.sortBy || 'shortest_wait',
      }).toString();

      const res = await fetch(`/api/clinics/search?${queryString}`);
      if (res.ok) {
        const data = await res.json();
        setClinicsList(data);
      }
    } catch (e) {
      console.error('Failed to query clinics:', e);
    } finally {
      setLoadingClinics(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => fetchClinics(searchParams), 0);
    return () => clearTimeout(id);
  }, [searchParams]);

  const features = [
    {
      icon: <Smartphone className="w-5 h-5 text-primary" />,
      title: "QR Check-In Kiosk",
      description: "Patients check in by scanning a unique QR code. Automates token generation and alerts staff instantly."
    },
    {
      icon: <Clock className="w-5 h-5 text-primary" />,
      title: "Live Queue Status",
      description: "Real-time updates of queue positions, estimated wait times, and serving room indicators via WebSockets."
    },
    {
      icon: <Users className="w-5 h-5 text-emerald-500" />,
      title: "Walk-In Registrations",
      description: "Fast-track tablet inputs for walk-in patient profiles. Generates physical and digital token slips."
    },
    {
      icon: <Bot className="w-5 h-5 text-violet-500" />,
      title: "AI Optimization",
      description: "Predictive algorithms forecasting patient arrival surges, consultation duration, and no-show probabilities."
    },
    {
      icon: <Tv className="w-5 h-5 text-rose-500" />,
      title: "TV Waiting Room Display",
      description: "High-contrast visual boards with voice synthetic ticket announcements to coordinate waiting halls."
    },
    {
      icon: <Layers className="w-5 h-5 text-amber-500" />,
      title: "Multi-Clinic SaaS",
      description: "Run multiple branches or clinics on a unified tenant model. Strict isolated data architectures."
    }
  ];

  return (
    <PublicLayout>
      <div className="flex flex-col gap-16 pb-20">
        
        {/* HERO SEARCH PORTAL BANNER */}
        <section className="bg-gradient-to-tr from-bg-surface via-bg-surface to-primary/5 border-b border-border-subtle/40 pt-16 pb-12">
          <div className="max-w-6xl mx-auto px-4 flex flex-col items-center text-center gap-6">
            <div className="px-3 py-1 font-black text-[9px] uppercase tracking-widest bg-primary/10 text-primary border border-primary/15 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Skip the Waiting Hall
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black text-text-primary tracking-tight max-w-2xl leading-tight">
              Locate Clinics & Join the <span className="text-primary bg-clip-text bg-gradient-to-r from-primary to-indigo-600">Lobby Queue</span> Digitally
            </h1>
            
            <p className="text-xs sm:text-sm text-text-secondary max-w-lg leading-relaxed font-semibold">
              Find qualified physicians, track live patient wait times, and join virtual lines from your mobile browser without creating accounts.
            </p>

            <div className="w-full max-w-3xl mt-4">
              <SearchPanel onSearch={setSearchParams} />
            </div>
          </div>
        </section>

        {/* CLINIC SEARCH RESULTS PORTAL */}
        <section className="max-w-6xl mx-auto px-4 w-full flex flex-col gap-6 -mt-8">
          <div className="flex justify-between items-center border-b border-border-subtle/50 pb-3">
            <h2 className="text-base font-extrabold text-text-primary flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" /> Near-by Operational Clinics
            </h2>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider bg-bg-muted px-2.5 py-1 rounded-full">
              {clinicsList.length} matching centers
            </span>
          </div>

          {loadingClinics ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-64 rounded-2xl bg-bg-surface border border-border-subtle animate-pulse p-5 flex flex-col justify-between">
                  <div className="w-1/3 h-4 bg-bg-muted rounded-md" />
                  <div className="w-2/3 h-6 bg-bg-muted rounded-md" />
                  <div className="w-full h-8 bg-bg-muted rounded-md" />
                </div>
              ))}
            </div>
          ) : clinicsList.length === 0 ? (
            <div className="border border-dashed border-border-subtle rounded-2xl p-16 text-center flex flex-col items-center justify-center bg-bg-surface/50">
              <span className="text-4xl filter opacity-80 mb-3 select-none">🏥</span>
              <h3 className="text-sm font-bold text-text-primary">No Matching Clinics Found</h3>
              <p className="text-xs text-text-muted mt-1 max-w-xs leading-relaxed font-semibold">
                Adjust search keywords or remove location filters to locate available healthcare centers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {clinicsList.map((clinic) => (
                <ClinicCard
                  key={clinic.id}
                  clinic={clinic}
                  onJoinQueue={setActiveJoinClinic}
                />
              ))}
            </div>
          )}
        </section>

        {/* MODAL WRAPPER OR CONDITIONAL PORTALS */}
        {activeJoinClinic && (
          <JoinQueueDialog
            clinic={activeJoinClinic}
            onClose={() => setActiveJoinClinic(null)}
            onSuccess={(tokenData) => {
              setActiveJoinClinic(null);
              setGeneratedToken(tokenData);
              fetchClinics(searchParams); // Refresh status count
            }}
          />
        )}

        {generatedToken && (
          <TokenSuccess
            tokenData={generatedToken}
            onClose={() => setGeneratedToken(null)}
          />
        )}

        {/* MARKETING / PRODUCT SECTION (retaining existing SaaS elements) */}
        <section className="max-w-6xl mx-auto px-4 w-full flex flex-col gap-12 border-t border-border-subtle/50 pt-16">
          <div className="text-center flex flex-col items-center gap-3">
            <h2 className="text-2xl font-black text-text-primary tracking-tight">Clinic SaaS Operations Platform</h2>
            <p className="text-xs text-text-secondary max-w-md font-semibold">
              Powering modern clinics with visual lobby status displays, AI wait estimations, and tablet check-in portals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feat, idx) => (
              <Card key={idx} className="p-6 border border-border-subtle bg-bg-surface flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm text-primary">
                  {feat.icon}
                </div>
                <h3 className="font-extrabold text-sm text-text-primary mt-1">{feat.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed font-semibold">{feat.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ ACCORDION PANEL */}
        <section className="max-w-4xl mx-auto px-4 w-full flex flex-col gap-8 border-t border-border-subtle/50 pt-16">
          <div className="text-center">
            <h2 className="text-xl font-black text-text-primary tracking-tight">Frequently Asked Questions</h2>
          </div>

          <Accordion
            items={[
              {
                id: 'faq-1',
                title: 'Do I need to sign up to join the queue?',
                content: 'No. Q-Clinix enforces account-free patient check-ins. Simply input your name, age, and phone number to obtain a waiting slip. The browser saves your ticket key dynamically.',
              },
              {
                id: 'faq-2',
                title: 'How is the wait time estimated?',
                content: "Estimates are derived by multiplying the current count of waiting patient tokens ahead of you by the doctor's historical average consultation time limit.",
              },
              {
                id: 'faq-3',
                title: 'Can I cancel my place if I am running late?',
                content: 'Yes. You can cancel your online check-in ticket at any time directly from the Track Queue console.',
              },
            ]}
          />
        </section>

      </div>
    </PublicLayout>
  );
}
