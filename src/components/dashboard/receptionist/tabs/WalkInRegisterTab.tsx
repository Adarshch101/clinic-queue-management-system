'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { UserPlus, Printer } from 'lucide-react';
import type { Doctor, QueueToken, Clinic } from '@/lib/mockData';
import type { ValidationErrors } from '@/lib/validation';

interface WalkInRegisterTabProps {
  walkInName: string;
  setWalkInName: (v: string) => void;
  walkInAge: string;
  setWalkInAge: (v: string) => void;
  walkInGender: string;
  setWalkInGender: (v: string) => void;
  walkInPhone: string;
  setWalkInPhone: (v: string) => void;
  walkInDocId: string;
  setWalkInDocId: (v: string) => void;
  walkInReason: string;
  setWalkInReason: (v: string) => void;
  walkInErrors: ValidationErrors;
  registerLoading: boolean;
  handleWalkInSubmit: (e: React.FormEvent) => Promise<void>;
  printedSlip: QueueToken | null;
  setPrintedSlip: (t: QueueToken | null) => void;
  doctors: Doctor[];
  currentClinic: Clinic | null;
}

export function WalkInRegisterTab({
  walkInName,
  setWalkInName,
  walkInAge,
  setWalkInAge,
  walkInGender,
  setWalkInGender,
  walkInPhone,
  setWalkInPhone,
  walkInDocId,
  setWalkInDocId,
  walkInReason,
  setWalkInReason,
  walkInErrors,
  registerLoading,
  handleWalkInSubmit,
  printedSlip,
  setPrintedSlip,
  doctors,
  currentClinic,
}: WalkInRegisterTabProps) {
  const activeDoctors = doctors.filter((d) => d.clinicId === currentClinic?.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      {/* Registration Form */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <Card className="flex flex-col gap-5 p-6">
          <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
            <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <UserPlus className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-text-primary tracking-tight">
                Register Walk-In Patient
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Issue live lobby queue token voucher for walk-in patient.
              </p>
            </div>
          </div>

          <form onSubmit={handleWalkInSubmit} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              required
              placeholder="e.g. John Doe"
              value={walkInName}
              onChange={(e) => setWalkInName(e.target.value)}
              error={walkInErrors.name || undefined}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Age"
                type="number"
                required
                placeholder="Age in years"
                value={walkInAge}
                onChange={(e) => setWalkInAge(e.target.value)}
                error={walkInErrors.age || undefined}
              />
              <Select
                label="Gender"
                value={walkInGender}
                onChange={(e) => setWalkInGender(e.target.value)}
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>

            <Input
              label="Contact Phone Number"
              type="tel"
              required
              placeholder="e.g. +1 (555) 000-1234"
              value={walkInPhone}
              onChange={(e) => setWalkInPhone(e.target.value)}
              error={walkInErrors.phone || undefined}
            />

            <Select
              label="Assign Physician Room"
              required
              value={walkInDocId}
              onChange={(e) => setWalkInDocId(e.target.value)}
              error={walkInErrors.doctorId || undefined}
              options={[
                { value: '', label: 'Select Physician...' },
                ...activeDoctors.map((d) => ({
                  value: d.id,
                  label: `${d.name} (${d.specialization} • Room ${d.roomNumber || '101'})`,
                })),
              ]}
            />

            <Input
              label="Chief Complaint / Visit Reason"
              required
              placeholder="e.g. Fever, routine check-up, report review..."
              value={walkInReason}
              onChange={(e) => setWalkInReason(e.target.value)}
              error={walkInErrors.reason || undefined}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 font-extrabold text-white"
              isLoading={registerLoading}
            >
              <UserPlus className="w-4 h-4" /> Issue Lobby Queue Token
            </Button>
          </form>
        </Card>
      </div>

      {/* Slip Voucher Preview Card */}
      <div className="flex flex-col gap-6">
        {printedSlip ? (
          <Card className="bg-warning-muted/20 border-warning/30 p-6 flex flex-col items-center text-center gap-4 animate-slide-up relative">
            <button
              onClick={() => setPrintedSlip(null)}
              className="absolute right-4 top-4 text-xs font-bold text-text-muted hover:text-text-primary"
            >
              ✕
            </button>
            <div className="text-[10px] font-black uppercase text-warning tracking-widest">
              Lobby Queue Voucher Slip
            </div>
            <div className="text-4xl font-black text-primary tracking-tight animate-pulse">
              {printedSlip.tokenNumber}
            </div>
            <div className="font-extrabold text-sm text-text-primary">{printedSlip.patientName}</div>
            <div className="text-xs text-text-secondary font-medium">
              Doctor: {doctors.find((d) => d.id === printedSlip.doctorId)?.name || 'Assigned Physician'}
            </div>
            <div className="text-xs text-text-muted">
              Estimated Wait Time: ~{printedSlip.estimatedWait} mins
            </div>
            <div className="w-full border-t border-dashed border-border-subtle my-1" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => alert('Sending print command to thermal receipt printer...')}
              className="w-full justify-center text-xs font-bold"
            >
              <Printer className="w-4 h-4 text-primary" /> Print Thermal Ticket
            </Button>
          </Card>
        ) : (
          <Card className="p-8 text-center flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border-subtle bg-bg-surface/50">
            <Printer className="w-8 h-8 text-text-muted opacity-40" />
            <div className="text-xs font-bold text-text-primary">No Active Voucher Slip</div>
            <p className="text-[11px] text-text-secondary">
              Register a walk-in patient to view and print the thermal ticket voucher.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
