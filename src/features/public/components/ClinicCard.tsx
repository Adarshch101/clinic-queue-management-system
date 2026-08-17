'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MapPin, Clock, Users, ArrowRight } from 'lucide-react';

export interface PublicClinicDoctor {
  id: string;
  name: string;
  specialization: string;
  averageConsultationTime?: number;
}

export interface PublicClinic {
  id: string;
  name: string;
  status?: string;
  address: string;
  city?: string;
  pincode?: string;
  logoUrl?: string;
  profile?: {
    bannerUrl?: string;
    clinicType?: string;
  };
  doctors?: PublicClinicDoctor[];
  queueTokens?: { status: string }[];
}

interface ClinicCardProps {
  clinic: PublicClinic;
  onJoinQueue: (clinic: PublicClinic) => void;
}

export const ClinicCard: React.FC<ClinicCardProps> = ({ clinic, onJoinQueue }) => {
  // Compute open/closed status
  const isOpen = clinic.status === 'VERIFIED'; // Verified clinics are operational, status drafts are closed
  const docNames = clinic.doctors?.map((d) => d.name).join(', ') || 'General Practitioners';
  const specialties = clinic.doctors?.map((d) => d.specialization).filter((v, i, a) => a.indexOf(v) === i).join(', ') || 'General';

  // Calculate estimated wait time based on queue length
  const queueLength = clinic.queueTokens?.filter((t) => t.status === 'WAITING').length || 0;
  const avgWaitTime = clinic.doctors?.[0]?.averageConsultationTime || 12;
  const estimatedWait = queueLength * avgWaitTime;

  return (
    <Card className="flex flex-col gap-4 border border-border-subtle bg-bg-surface hover:shadow-lg transition-all rounded-2xl overflow-hidden group">
      {/* Clinic banner */}
      <div className="h-28 bg-gradient-to-r from-primary/80 to-indigo-600/80 relative flex items-end p-4 text-white">
        {clinic.profile?.bannerUrl && (
          <img src={clinic.profile.bannerUrl} alt={clinic.name} className="absolute inset-0 w-full h-full object-cover opacity-20" />
        )}
        <div className="absolute inset-0 bg-black/10" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white text-primary text-xl font-black flex items-center justify-center shadow shrink-0 border border-white">
            {clinic.logoUrl || '🏥'}
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight truncate max-w-[200px]">{clinic.name}</h3>
            <p className="text-[10px] text-indigo-100 font-bold tracking-wider uppercase">{clinic.profile?.clinicType || 'General Practice'}</p>
          </div>
        </div>
      </div>

      <div className="p-5 pt-1 flex flex-col gap-4 text-xs font-semibold text-text-secondary">
        {/* Doctors & Specialities */}
        <div className="flex flex-col gap-0.5 truncate">
          <span className="text-[10px] uppercase font-bold text-text-muted">Physicians</span>
          <span className="text-text-primary font-black truncate">{docNames}</span>
          <span className="text-[10px] text-primary truncate">{specialties}</span>
        </div>

        {/* Info stats */}
        <div className="grid grid-cols-2 gap-3.5 border-t border-b border-border-subtle/50 py-3 mt-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-text-muted shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-text-muted">Operational</span>
              <span className="text-[10px] font-bold text-text-primary leading-tight">
                {isOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-text-muted shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-text-muted">Active Queue</span>
              <span className="text-[10px] font-bold text-text-primary leading-tight">
                {queueLength} waiting ({estimatedWait}m wait)
              </span>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-1.5 text-text-muted">
          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="truncate">
            {clinic.address}, {clinic.city} {clinic.pincode ? `(${clinic.pincode})` : ''}
          </span>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-2.5 mt-2">
          <Link href={`/clinics/${clinic.id}`} className="flex-1">
            <Button variant="outline" className="w-full text-xs font-black uppercase tracking-wider py-2.5 h-[40px]">
              Profile Details
            </Button>
          </Link>
          <Button
            onClick={() => onJoinQueue(clinic)}
            disabled={!isOpen}
            variant="primary"
            className="flex-1 text-xs font-black uppercase tracking-wider py-2.5 h-[40px] bg-primary group-hover:shadow-md transition"
          >
            Join Queue <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
export default ClinicCard;
