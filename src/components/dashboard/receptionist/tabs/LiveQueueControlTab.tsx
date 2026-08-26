'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { 
  Activity, AlertTriangle, ChevronUp, ChevronDown, 
  Trash2, Printer
} from 'lucide-react';
import type { QueueToken, Doctor } from '@/lib/mockData';

interface LiveQueueControlTabProps {
  activeQueues: QueueToken[];
  doctors: Doctor[];
  selectedDoctorId: string;
  setSelectedDoctorId: (id: string) => void;
  reorderQueue: (tokenId: string, direction: 'up' | 'down') => Promise<void>;
  toggleEmergency: (tokenId: string, status: boolean) => Promise<void>;
  transferPatient: (tokenId: string, newDoctorId: string) => Promise<void>;
  cancelPatientToken: (tokenId: string) => Promise<void>;
  handlePrint: (token: QueueToken) => void;
}

export function LiveQueueControlTab({
  activeQueues,
  doctors,
  selectedDoctorId,
  setSelectedDoctorId,
  reorderQueue,
  toggleEmergency,
  transferPatient,
  cancelPatientToken,
  handlePrint,
}: LiveQueueControlTabProps) {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <Card className="flex flex-col gap-5 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle pb-4">
          <div>
            <h3 className="font-black text-base text-text-primary flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Live Lobby Queue Orchestration ({activeQueues.length})
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Reorder priorities, toggle emergency tags, transfer between physicians, or print slips.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <Select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              options={[
                { value: 'all', label: 'All Physicians' },
                ...doctors.map((d) => ({
                  value: d.id,
                  label: `${d.name} (Room ${d.roomNumber || '101'})`,
                })),
              ]}
            />
          </div>
        </div>

        {activeQueues.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted bg-bg-muted/20 rounded-2xl border border-dashed border-border-subtle flex flex-col items-center justify-center gap-2">
            <Activity className="w-8 h-8 text-text-muted opacity-40" />
            <span>No active tokens currently serving or waiting in lobby.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeQueues.map((token, idx) => {
              const assignedDoctor = doctors.find((d) => d.id === token.doctorId);
              return (
                <div
                  key={token.id}
                  className={`p-4 rounded-2xl border transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                    token.isEmergency
                      ? 'border-danger/50 bg-danger-muted/10 shadow-sm'
                      : 'border-border-subtle bg-bg-surface hover:border-border-focus/40'
                  }`}
                >
                  {/* Left Token Summary */}
                  <div className="flex items-center gap-4 truncate">
                    <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-primary-glow/20 border border-primary/20 shrink-0 min-w-[64px]">
                      <span className="text-xl font-black text-primary leading-none">{token.tokenNumber}</span>
                      <span className="text-[9px] font-bold text-text-muted mt-1 uppercase">#{idx + 1}</span>
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-text-primary">{token.patientName}</span>
                        {token.isEmergency && (
                          <Chip label="EMERGENCY" size="small" color="error" className="font-black text-[9px]" />
                        )}
                        <Badge
                          variant={
                            token.status === 'IN_CONSULTATION'
                              ? 'primary'
                              : token.status === 'CALLED'
                              ? 'warning'
                              : 'secondary'
                          }
                          className="text-[9px]"
                        >
                          {token.status}
                        </Badge>
                      </div>

                      <div className="text-xs text-text-secondary mt-1 font-medium truncate">
                        Physician: <span className="text-text-primary font-bold">{assignedDoctor?.name || 'Assigned Doctor'}</span> (Room {assignedDoctor?.roomNumber || '101'}) • Est. wait ~{token.estimatedWait}m
                      </div>
                    </div>
                  </div>

                  {/* Right Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 border-border-subtle/50 pt-3 md:pt-0">
                    <Tooltip title="Print slip voucher">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrint(token)}
                        className="text-xs text-text-secondary"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                    </Tooltip>

                    <Tooltip title="Toggle Emergency Priority">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleEmergency(token.id, !token.isEmergency)}
                        className={`text-xs ${token.isEmergency ? 'border-danger text-danger bg-danger-muted' : ''}`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </Button>
                    </Tooltip>

                    <div className="flex items-center gap-1 border-l border-r border-border-subtle px-1">
                      <Tooltip title="Move up in queue rank">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => reorderQueue(token.id, 'up')}
                          className="p-1"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip title="Move down in queue rank">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => reorderQueue(token.id, 'down')}
                          className="p-1"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                    </div>

                    {/* Doctor Transfer Select */}
                    <div className="w-36">
                      <Select
                        value={token.doctorId}
                        onChange={(e) => transferPatient(token.id, e.target.value)}
                        options={doctors.map((d) => ({
                          value: d.id,
                          label: d.name,
                        }))}
                        className="text-xs"
                      />
                    </div>

                    <Tooltip title="Cancel Token">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelPatientToken(token.id)}
                        className="text-xs text-danger hover:bg-danger-muted"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </Tooltip>
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
