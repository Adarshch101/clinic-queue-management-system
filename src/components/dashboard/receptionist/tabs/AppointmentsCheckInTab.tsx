'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { CalendarCheck, UserCheck, Search, Trash2, UserX } from 'lucide-react';
import type { Appointment } from '@/lib/mockData';

interface AppointmentsCheckInTabProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filteredAppointments: Appointment[];
  checkInAppointment: (id: string) => Promise<unknown>;
  cancelAppointment: (id: string) => Promise<void>;
  markNoShow: (id: string) => Promise<void>;
}

export function AppointmentsCheckInTab({
  searchQuery,
  setSearchQuery,
  filteredAppointments,
  checkInAppointment,
  cancelAppointment,
  markNoShow,
}: AppointmentsCheckInTabProps) {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <Card className="flex flex-col gap-5 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle pb-4">
          <div>
            <h3 className="font-black text-base text-text-primary flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary" />
              Scheduled Appointments Check-In Hub ({filteredAppointments.length})
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Check in scheduled patients into the live lobby queue as they arrive.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <Input
              isSearch
              placeholder="Search by patient, doctor, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted bg-bg-muted/20 rounded-2xl border border-dashed border-border-subtle flex flex-col items-center justify-center gap-2">
            <Search className="w-8 h-8 text-text-muted opacity-40" />
            <span>No scheduled appointments matching your search query.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.map((appt) => {
              const displayTime = (appt as unknown as Record<string, unknown>).time as string || appt.dateTime;
              return (
                <div
                  key={appt.id}
                  className="p-4 rounded-2xl border border-border-subtle bg-bg-surface flex flex-col justify-between gap-4 transition hover:border-primary/40 shadow-sm"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-extrabold text-sm text-text-primary">{appt.patientName}</div>
                      <div className="text-xs text-text-muted mt-0.5">Dr. {appt.doctorName}</div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {displayTime}
                    </Badge>
                  </div>

                  <div className="text-xs text-text-secondary line-clamp-2">
                    <span className="font-semibold text-text-primary">Reason:</span> {appt.reason}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle/50 pt-3">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => checkInAppointment(appt.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Check-In
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => markNoShow(appt.id)}
                        className="text-xs text-amber-600 hover:bg-amber-500/10"
                        title="Mark as No-Show"
                      >
                        <UserX className="w-3.5 h-3.5" /> No-Show
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelAppointment(appt.id)}
                        className="text-xs text-danger hover:bg-danger-muted"
                        title="Cancel Appointment"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
