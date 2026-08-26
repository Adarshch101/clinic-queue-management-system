'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { History, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';
import type { QueueToken } from '@/lib/mockData';

interface DoctorHistoryTabProps {
  completedToday: QueueToken[];
}

export function DoctorHistoryTab({ completedToday }: DoctorHistoryTabProps) {
  const [expandedTokenId, setExpandedTokenId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedTokenId(prev => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      <Card className="flex flex-col gap-4 p-6">
        <div className="flex justify-between items-center border-b border-border-subtle pb-4">
          <div>
            <h3 className="font-black text-base text-text-primary flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-500" />
              Completed Consultations Today ({completedToday.length})
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">Archive log of patients discharged today.</p>
          </div>
        </div>

        {completedToday.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted bg-bg-muted/20 rounded-2xl border border-dashed border-border-subtle flex flex-col items-center justify-center gap-2">
            <UserCheck className="w-8 h-8 text-text-muted opacity-40" />
            <span>No consultations completed yet today.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {completedToday.map((token) => {
              const isExpanded = expandedTokenId === token.id;
              return (
                <div
                  key={token.id}
                  className="p-4 rounded-2xl border border-border-subtle bg-bg-surface flex flex-col gap-3 transition hover:border-border-focus/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-primary">{token.tokenNumber}</span>
                      <div>
                        <div className="font-extrabold text-sm text-text-primary">{token.patientName}</div>
                        <div className="text-[10px] text-text-muted">Reason: {token.reason}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="success" className="text-[10px]">COMPLETED</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(token.id)}
                        className="text-xs"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 p-3.5 rounded-xl bg-bg-muted/40 border border-border-subtle text-xs space-y-2 animate-slide-up">
                      <div>
                        <span className="font-bold text-text-primary">Discharged Time:</span> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div>
                        <span className="font-bold text-text-primary">Patient Age / Gender:</span> {token.patientAge ? `${token.patientAge} yrs` : 'N/A'} • {token.patientGender || 'N/A'}
                      </div>
                      <div className="text-text-secondary">
                        <span className="font-bold text-text-primary">Clinical Summary:</span> Completed examination and entry registered in health ledger.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
