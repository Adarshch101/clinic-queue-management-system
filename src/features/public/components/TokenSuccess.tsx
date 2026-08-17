'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Ticket, Users, Clock, ArrowRight } from 'lucide-react';

export interface TokenSuccessData {
  tokenNumber: string;
  patientsAhead?: number;
  estimatedWait?: number;
  patientName?: string;
  doctorName?: string;
}

interface TokenSuccessProps {
  tokenData: TokenSuccessData;
  onClose: () => void;
}

export const TokenSuccess: React.FC<TokenSuccessProps> = ({ tokenData, onClose }) => {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <Card className="w-full max-w-md bg-bg-surface border border-border-subtle shadow-2xl rounded-3xl overflow-hidden flex flex-col p-6 items-center text-center gap-6 relative">
        
        {/* Success Icon */}
        <div className="w-14 h-14 rounded-full bg-success-muted border border-success/20 text-success flex items-center justify-center shadow-sm shrink-0">
          <CheckCircle2 className="w-7 h-7 animate-bounce" />
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-black text-text-primary tracking-tight">Successfully Checked In!</h2>
          <p className="text-xs text-text-secondary leading-relaxed font-semibold">
            Your online lobby token has been registered. You can track your real-time waiting position below.
          </p>
        </div>

        {/* Token Card details */}
        <div className="w-full bg-gradient-to-br from-primary to-indigo-600 rounded-2xl p-5 text-white flex flex-col gap-4 shadow shadow-primary/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 text-[100px] font-black opacity-10 pointer-events-none select-none translate-x-5 -translate-y-5">
            Q
          </div>
          
          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-indigo-100 border-b border-white/20 pb-2">
            <span>Online Lobby Ticket</span>
            <span>Clinic Queue Management</span>
          </div>

          <div className="flex flex-col items-center py-2.5">
            <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Token Number</span>
            <div className="text-4xl font-black tracking-tight mt-1 flex items-center gap-1.5 justify-center">
              <Ticket className="w-8 h-8 opacity-75 shrink-0" />
              {tokenData.tokenNumber}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-3 text-xs font-bold">
            <div className="flex flex-col gap-0.5 items-start">
              <span className="text-[9px] text-indigo-100 uppercase tracking-widest font-black">Patients Ahead</span>
              <span className="text-sm font-black flex items-center gap-1">
                <Users className="w-4 h-4 text-indigo-100 shrink-0" />
                {tokenData.patientsAhead ?? 0} patients
              </span>
            </div>

            <div className="flex flex-col gap-0.5 items-end">
              <span className="text-[9px] text-indigo-100 uppercase tracking-widest font-black">Estimated Wait</span>
              <span className="text-sm font-black flex items-center gap-1">
                <Clock className="w-4 h-4 text-indigo-100 shrink-0" />
                {tokenData.estimatedWait ?? 0} mins
              </span>
            </div>
          </div>
        </div>

        {/* Info detail bullet card */}
        <div className="w-full p-4 rounded-xl border border-border-subtle bg-bg-muted/10 text-xs font-semibold text-text-secondary flex flex-col gap-2.5">
          <div className="flex justify-between">
            <span className="text-text-muted">Registered Name:</span>
            <span className="text-text-primary font-bold">{tokenData.patientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Assigned Doctor:</span>
            <span className="text-text-primary font-bold">{tokenData.doctorName}</span>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 text-xs font-black uppercase tracking-wider py-2.5 h-[40px]"
          >
            Close Dialog
          </Button>
          <Button
            onClick={() => {
              onClose();
              router.push('/queue-status');
            }}
            variant="primary"
            className="flex-1 text-xs font-black uppercase tracking-wider py-2.5 h-[40px] bg-primary flex items-center justify-center gap-1"
          >
            Track Status <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

      </Card>
    </div>
  );
};
export default TokenSuccess;
