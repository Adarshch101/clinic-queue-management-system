'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Phone, Mail, Clock, Calendar, ShieldCheck } from 'lucide-react';

interface ProfilePreviewDoctor {
  name?: string;
  specialization?: string;
  avatarUrl?: string;
  consultationFee?: string | number;
  consultationDuration?: string | number;
}

interface ProfilePreviewData {
  clinicName?: string;
  tagline?: string;
  description?: string;
  bannerUrl?: string;
  logoUrl?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  workingDays?: string[];
  openingTime?: string;
  closingTime?: string;
  lunchBreak?: string;
  services?: string;
  doctors?: ProfilePreviewDoctor[];
}

interface ProfilePreviewProps {
  data: ProfilePreviewData;
}

export const ProfilePreview: React.FC<ProfilePreviewProps> = ({ data }) => {
  const doctorsList = data.doctors || [];
  const servicesList = data.services
    ? data.services.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '')
    : [];

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto border border-border-subtle rounded-2xl overflow-hidden bg-bg-surface shadow-md">
      {/* Banner */}
      <div className="h-44 bg-gradient-to-tr from-primary to-indigo-600 relative flex items-end p-6 text-white">
        {data.bannerUrl && (
          <img src={data.bannerUrl} alt="Clinic Banner" className="absolute inset-0 w-full h-full object-cover opacity-35" />
        )}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white text-primary text-3xl font-black flex items-center justify-center shadow shadow-black/25 shrink-0 border border-white">
            {data.logoUrl || '🏥'}
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">{data.clinicName || 'Clinic Name'}</h1>
            <p className="text-xs text-indigo-100 font-semibold">{data.tagline || 'Clinic Tagline Statement'}</p>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6 text-xs text-text-secondary leading-relaxed">
        {/* Description */}
        {data.description && (
          <div className="flex flex-col gap-1.5">
            <span className="font-extrabold text-[10px] uppercase text-text-muted tracking-wider">About Clinic</span>
            <p className="font-medium text-text-secondary">{data.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Details */}
          <div className="flex flex-col gap-3">
            <span className="font-extrabold text-[10px] uppercase text-text-muted tracking-wider">Contact & Address</span>
            <div className="flex flex-col gap-2 font-medium">
              <div className="flex items-start gap-2">
                <MapPin className="w-4.5 h-4.5 text-text-muted shrink-0 mt-0.5" />
                <span>
                  {data.addressLine1 ? `${data.addressLine1}, ` : ''}
                  {data.addressLine2 ? `${data.addressLine2}, ` : ''}
                  {data.city ? `${data.city}, ` : ''}
                  {data.state ? `${data.state} ` : ''}
                  {data.pincode ? `(${data.pincode})` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4.5 h-4.5 text-text-muted shrink-0" />
                <span>{data.primaryPhone || 'Primary Phone'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4.5 h-4.5 text-text-muted shrink-0" />
                <span>{data.primaryEmail || 'Support Email'}</span>
              </div>
            </div>
          </div>

          {/* Operational Hours */}
          <div className="flex flex-col gap-3">
            <span className="font-extrabold text-[10px] uppercase text-text-muted tracking-wider">Operational Hours</span>
            <div className="flex flex-col gap-2 font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-text-muted shrink-0" />
                <span>
                  Working Days: {data.workingDays ? data.workingDays.join(', ') : 'Mon - Fri'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-text-muted shrink-0" />
                <span>
                  Hours: {data.openingTime || '09:00 AM'} - {data.closingTime || '05:00 PM'}
                </span>
              </div>
              {data.lunchBreak && (
                <div className="text-[10px] text-text-muted ml-6.5 font-bold">
                  Lunch Break: {data.lunchBreak}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services */}
        {servicesList.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-border-subtle/50 pt-4">
            <span className="font-extrabold text-[10px] uppercase text-text-muted tracking-wider">Services Offered</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {servicesList.map((service: string, idx: number) => (
                <Badge key={idx} variant="primary">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Doctors */}
        {doctorsList.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border-subtle/50 pt-4">
            <span className="font-extrabold text-[10px] uppercase text-text-muted tracking-wider">Physicians List</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
              {doctorsList.map((doc, idx: number) => (
                <Card key={idx} className="flex gap-3 p-3.5 border border-border-subtle/85 bg-bg-surface hover:shadow transition">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-bg-muted border border-border-subtle/60 shrink-0 flex items-center justify-center text-sm font-bold text-text-secondary select-none">
                    {doc.avatarUrl ? (
                      <img src={doc.avatarUrl} alt={doc.name} className="w-full h-full object-cover" />
                    ) : (
                      doc.name?.charAt(0) || 'D'
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 truncate">
                    <div className="font-extrabold text-text-primary truncate flex items-center gap-1">
                      {doc.name || 'Doctor Name'}
                      <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                    </div>
                    <div className="text-[10px] font-bold text-primary uppercase tracking-wider">{doc.specialization || 'General'}</div>
                    <div className="text-[10px] text-text-muted mt-1 font-semibold truncate">
                      Fee: ${doc.consultationFee || '10'} • {doc.consultationDuration || '15'}m slots
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ProfilePreview;
