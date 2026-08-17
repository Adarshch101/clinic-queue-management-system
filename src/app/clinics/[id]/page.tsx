'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { JoinQueueDialog } from '@/features/public/components/JoinQueueDialog';
import { TokenSuccess, type TokenSuccessData } from '@/features/public/components/TokenSuccess';
import { 
  Phone, MapPin, Clock, 
  ChevronLeft, AlertTriangle, ShieldCheck, Mail, Calendar, Compass 
} from 'lucide-react';

interface ClinicDetailDoctor {
  id: string;
  name: string;
  specialization: string;
  avatarUrl?: string;
  consultationFee?: number | string;
  averageConsultationTime?: number;
}

interface ClinicDetailProfile {
  services?: string;
  bannerUrl?: string;
  clinicType?: string;
  description?: string;
  googleMapsUrl?: string;
}

interface ClinicDetailToken {
  status: string;
}

interface ClinicDetails {
  id: string;
  name: string;
  status: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  profile?: ClinicDetailProfile;
  doctors?: ClinicDetailDoctor[];
  queueTokens?: ClinicDetailToken[];
}

export default function ClinicDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const clinicId = params.id as string;

  const [clinic, setClinic] = useState<ClinicDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeJoin, setActiveJoin] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<TokenSuccessData | null>(null);

  const fetchClinicDetails = async () => {
    try {
      const res = await fetch(`/api/clinics/details?clinicId=${clinicId}`);
      if (res.ok) {
        const data = await res.json();
        setClinic(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => fetchClinicDetails(), 0);
    return () => clearTimeout(id);
  }, [clinicId]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center p-20 gap-4 text-xs text-text-secondary">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <span>Retrieving clinic profile details...</span>
        </div>
      </PublicLayout>
    );
  }

  if (!clinic) {
    return (
      <PublicLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 rounded-full bg-danger-muted border border-danger/25 text-danger flex items-center justify-center shadow-sm shrink-0">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-black text-text-primary tracking-tight">Clinic Not Found</h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-semibold">
              The requested clinic center profile could not be resolved. Please verify details.
            </p>
          </div>
          <Button onClick={() => router.push('/')} variant="primary">
            Return to Directory
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const isOpen = clinic.status === 'VERIFIED';
  const doctorsList = clinic.doctors || [];
  const servicesList = clinic.profile?.services
    ? clinic.profile.services.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '')
    : [];
  const queueLength = clinic.queueTokens?.filter((t) => t.status === 'WAITING').length || 0;
  const avgWaitTime = clinic.doctors?.[0]?.averageConsultationTime || 12;
  const estimatedWait = queueLength * avgWaitTime;

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6">
        
        {/* Back button */}
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-xs font-black text-text-muted hover:text-text-primary transition uppercase tracking-wider self-start"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Directory
        </button>

        {/* Banner header profile card */}
        <div className="bg-bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <div className="h-56 bg-gradient-to-r from-primary to-indigo-650 relative flex items-end p-6 text-white">
            {clinic.profile?.bannerUrl && (
              <img src={clinic.profile.bannerUrl} alt={clinic.name} className="absolute inset-0 w-full h-full object-cover opacity-25" />
            )}
            <div className="absolute inset-0 bg-black/20" />
            
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white text-primary text-4xl font-black flex items-center justify-center shadow-lg shrink-0 border border-white">
                {clinic.logoUrl || '🏥'}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">{clinic.name}</h1>
                <p className="text-xs text-indigo-150 font-bold tracking-wider uppercase mt-0.5">{clinic.profile?.clinicType || 'General Medical Practice'}</p>
                <div className="text-[10px] text-indigo-100 font-semibold mt-2.5 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> Verified Medical Facility
                </div>
              </div>
            </div>
          </div>

          {/* Details body column */}
          <div className="p-6 sm:p-8 flex flex-col lg:flex-row gap-8">
            
            {/* Left detail grid */}
            <div className="flex-1 flex flex-col gap-8 text-xs text-text-secondary leading-relaxed font-semibold">
              
              {/* About */}
              {clinic.profile?.description && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">About the Clinic</span>
                  <p className="font-medium text-text-secondary">{clinic.profile.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-border-subtle/50">
                {/* Contact and address */}
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Contact & Location</span>
                  <div className="flex flex-col gap-3 font-medium">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4.5 h-4.5 text-text-muted mt-0.5 shrink-0" />
                      <span>
                        {clinic.address}, {clinic.city}, {clinic.state} ({clinic.pincode})
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4.5 h-4.5 text-text-muted shrink-0" />
                      <span>{clinic.phone || 'Primary Contact'}</span>
                    </div>
                    {clinic.email && (
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4.5 h-4.5 text-text-muted shrink-0" />
                        <span>{clinic.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hours */}
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Operational Calendar</span>
                  <div className="flex flex-col gap-3 font-medium">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4.5 h-4.5 text-text-muted shrink-0" />
                      <span>Operational Days: Mon - Sat</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4.5 h-4.5 text-text-muted shrink-0" />
                      <span>Status: {isOpen ? 'Open Now' : 'Closed'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services tags */}
              {servicesList.length > 0 && (
                <div className="flex flex-col gap-3 pt-6 border-t border-border-subtle/50">
                  <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Available Services</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {servicesList.map((service: string, idx: number) => (
                      <Badge key={idx} variant="primary">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctors list roster */}
              {doctorsList.length > 0 && (
                <div className="flex flex-col gap-4 pt-6 border-t border-border-subtle/50">
                  <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">On-Duty Physicians</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                    {doctorsList.map((doc) => (
                      <Card key={doc.id} className="p-4 border border-border-subtle bg-bg-surface flex gap-3.5 hover:shadow transition">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-bg-muted border border-border-subtle/60 shrink-0 flex items-center justify-center text-sm font-bold text-text-secondary select-none">
                          {doc.avatarUrl ? (
                            <img src={doc.avatarUrl} alt={doc.name} className="w-full h-full object-cover" />
                          ) : (
                            doc.name.charAt(0)
                          )}
                        </div>
                        <div className="flex flex-col truncate gap-0.5">
                          <span className="font-extrabold text-text-primary truncate">{doc.name}</span>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{doc.specialization}</span>
                          <span className="text-[10px] text-text-muted mt-1">Consultation fee: ${doc.consultationFee || '50'}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right sidebar: Live Queue CTA panel */}
            <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
              <Card className="p-5 border border-border-subtle bg-bg-muted/10 flex flex-col gap-5">
                <span className="text-[9px] font-black uppercase text-text-muted tracking-widest border-b border-border-subtle/30 pb-2">Live Queue Telemetry</span>
                
                <div className="flex flex-col items-center text-center py-3">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Current Waitlist</span>
                  <div className="text-3xl font-black text-text-primary tracking-tight mt-1">
                    {queueLength} Patients
                  </div>
                  <span className="text-[10px] text-primary font-bold mt-1.5 bg-primary/10 px-2.5 py-0.5 rounded-full">
                    {estimatedWait} mins est. wait
                  </span>
                </div>

                <div className="flex flex-col gap-3 text-[10px] font-bold text-text-secondary">
                  <div className="flex justify-between border-b border-border-subtle/40 pb-2">
                    <span className="text-text-muted">Queue Status:</span>
                    <span className="text-success uppercase font-black">Open</span>
                  </div>
                  <div className="flex justify-between border-b border-border-subtle/40 pb-2">
                    <span className="text-text-muted">Physicians Active:</span>
                    <span>{doctorsList.length} Serving</span>
                  </div>
                </div>

                <Button
                  onClick={() => setActiveJoin(true)}
                  disabled={!isOpen}
                  variant="primary"
                  className="w-full py-3 h-[42px] font-black uppercase tracking-wider bg-primary"
                >
                  Join Waiting Queue
                </Button>
              </Card>

              {/* Map Preview placeholder */}
              {clinic.profile?.googleMapsUrl && (
                <Card className="p-4 border border-border-subtle bg-bg-surface flex items-center gap-3.5 hover:shadow transition">
                  <Compass className="w-8 h-8 text-primary shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-black text-text-primary">Google Maps Address</span>
                    <a href={clinic.profile.googleMapsUrl} target="_blank" className="text-[10px] text-primary font-bold hover:underline">
                      Navigate to Clinic Location
                    </a>
                  </div>
                </Card>
              )}
            </div>

          </div>
        </div>

        {/* Dialog portal overlays */}
        {activeJoin && (
          <JoinQueueDialog
            clinic={clinic}
            onClose={() => setActiveJoin(false)}
            onSuccess={(tokenData) => {
              setActiveJoin(false);
              setGeneratedToken(tokenData);
              fetchClinicDetails(); // Refresh list count
            }}
          />
        )}

        {generatedToken && (
          <TokenSuccess
            tokenData={generatedToken}
            onClose={() => setGeneratedToken(null)}
          />
        )}

      </div>
    </PublicLayout>
  );
}
