'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Chip from '@mui/material/Chip';
import { Activity, Clock, Check, UserCheck, ShieldAlert } from 'lucide-react';
import type { QueueToken } from '@/lib/mockData';

interface DoctorQueueTabProps {
  upcomingQueue: QueueToken[];
  pendingEmergencies: QueueToken[];
  approveEmergency: (tokenId: string) => Promise<void>;
  actionLoading: boolean;
}

export function DoctorQueueTab({
  upcomingQueue,
  pendingEmergencies,
  approveEmergency,
  actionLoading,
}: DoctorQueueTabProps) {
  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      
      {/* Pending Emergency Priority Approval Banner */}
      {pendingEmergencies.length > 0 && (
        <Card className="border-danger/30 bg-danger-muted/20 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-danger font-black text-sm">
            <ShieldAlert className="w-5 h-5 animate-pulse shrink-0" />
            Pending Emergency Queue Requests ({pendingEmergencies.length})
          </div>
          <div className="flex flex-col gap-3">
            {pendingEmergencies.map((eToken) => (
              <div key={eToken.id} className="p-3.5 rounded-xl border border-danger/20 bg-bg-surface flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="font-extrabold text-sm text-text-primary flex items-center gap-2">
                    <span>{eToken.patientName}</span>
                    <Badge variant="danger" className="text-[10px]">{eToken.tokenNumber}</Badge>
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5 font-medium">Reason: {eToken.reason}</div>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => approveEmergency(eToken.id)}
                  isLoading={actionLoading}
                  className="bg-danger hover:bg-danger/90 text-white shrink-0 text-xs font-bold"
                >
                  <Check className="w-4 h-4" /> Grant Immediate Emergency Priority
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upcoming Waitlist Table / Cards */}
      <Card className="flex flex-col gap-4 p-6">
        <div className="flex justify-between items-center border-b border-border-subtle pb-4">
          <div>
            <h3 className="font-black text-base text-text-primary flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Room Waitlist Queue ({upcomingQueue.length})
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">Patients waiting in lobby sorted by priority rank.</p>
          </div>
        </div>

        {upcomingQueue.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted bg-bg-muted/20 rounded-2xl border border-dashed border-border-subtle flex flex-col items-center justify-center gap-2">
            <UserCheck className="w-8 h-8 text-text-muted opacity-40" />
            <span>No patients currently waiting in your queue.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingQueue.map((token, idx) => (
              <div
                key={token.id}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                  token.isEmergency
                    ? 'border-danger/40 bg-danger-muted/10 shadow-sm'
                    : 'border-border-subtle bg-bg-surface hover:border-primary/40'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-primary tracking-tight">{token.tokenNumber}</span>
                    <span className="font-extrabold text-sm text-text-primary mt-0.5">{token.patientName}</span>
                  </div>
                  {token.isEmergency ? (
                    <Chip label="EMERGENCY" size="small" color="error" className="font-black text-[9px]" />
                  ) : (
                    <Chip label={`#${idx + 1} in queue`} size="small" variant="outlined" className="text-[10px]" />
                  )}
                </div>

                <div className="text-xs text-text-secondary line-clamp-2">
                  <span className="font-semibold text-text-primary">Reason:</span> {token.reason}
                </div>

                <div className="flex justify-between items-center text-[10px] text-text-muted font-semibold border-t border-border-subtle/50 pt-2.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" /> Est: {token.estimatedWait}m
                  </span>
                  <span>Priority: {token.priority}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
