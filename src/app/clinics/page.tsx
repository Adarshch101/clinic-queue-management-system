'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MapPin, Phone, Clock } from 'lucide-react';
import Link from 'next/link';

export default function ClinicListing() {
  const { clinics, queueTokens } = useApp();
  const [search, setSearch] = useState('');

  // Filter clinics based on search query
  const filteredClinics = clinics.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
        
        {/* Title Banner */}
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-black tracking-tight text-text-primary">Clinic Directory</h1>
          <p className="text-sm text-text-secondary mt-1">
            Search clinics, view wait telemetry, and check in online to save your spot in line.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="max-w-md w-full">
          <Input
            isSearch
            placeholder="Search clinic name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Clinics Grid */}
        {filteredClinics.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border-subtle rounded-2xl bg-bg-surface flex flex-col items-center justify-center p-6">
            <span className="text-4xl">🏥</span>
            <h3 className="text-base font-bold text-text-primary mt-4">No clinics match your query</h3>
            <p className="text-xs text-text-muted mt-1 max-w-xs leading-relaxed">
              We couldn&apos;t find any clinic branches matching that name or address. Try another search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClinics.map((clinic) => {
              // Calculate estimated wait time based on waiting queue tokens
              const waitingTokensCount = queueTokens.filter(
                (t) => t.clinicId === clinic.id && ['WAITING', 'CALLED'].includes(t.status)
              ).length;
              const estWaitMins = waitingTokensCount * 12;

              return (
                <Card key={clinic.id} hoverable className="flex flex-col justify-between gap-6">
                  <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 rounded-xl bg-bg-muted border border-border-subtle shrink-0">
                          {clinic.logo}
                        </span>
                        <div>
                          <h3 className="font-extrabold text-sm text-text-primary">{clinic.name}</h3>
                          <span className="text-[10px] text-text-muted font-bold lowercase tracking-wider">
                            {clinic.subdomain}.q-clinix.com
                          </span>
                        </div>
                      </div>
                      <Badge variant="success">
                        Active
                      </Badge>
                    </div>

                    <div className="border-t border-border-subtle/50 my-1"></div>

                    {/* Details list */}
                    <div className="flex flex-col gap-2.5 text-xs text-text-secondary font-medium">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                        <span>{clinic.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-text-muted shrink-0" />
                        <span>{clinic.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-text-muted shrink-0" />
                        <span className="font-bold text-primary">
                          Est. Wait: {estWaitMins} mins
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/clinics/${clinic.id}`} className="flex-1">
                      <Button variant="outline" className="w-full text-xs font-bold py-2">
                        View Schedules
                      </Button>
                    </Link>
                    <Link href="/patient/dashboard" className="flex-1">
                      <Button variant="primary" className="w-full text-xs font-bold py-2">
                        Join Queue
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </PublicLayout>
  );
}
