'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Users, Clock, RefreshCw, AlertTriangle, 
  Trash2, ChevronLeft 
} from 'lucide-react';

interface TrackingSession {
  sessionId?: string;
  tokenId: string;
  clinicId?: string;
  tokenNumber: string;
  timestamp?: number;
}

interface QueueTrackStats {
  tokenNumber?: string;
  status?: string;
  estimatedWait?: number;
  patientsAhead?: number;
  clinicName?: string;
  doctorName?: string;
  patientName?: string;
}

export default function QueueStatusPage() {
  const router = useRouter();

  // Active tracked session
  const [session, setSession] = useState<TrackingSession | null>(null);
  const [tokenIdInput, setTokenIdInput] = useState('');
  const [trackError, setTrackError] = useState('');
  
  // Realtime token stats from PostgreSQL database
  const [tokenStats, setTokenStats] = useState<QueueTrackStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // 2. Fetch live waitlist status
  const fetchQueueStats = async (targetTokenId: string) => {
    setLoadingStats(true);
    setTrackError('');
    try {
      const res = await fetch(`/api/queue/track?tokenId=${targetTokenId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to locate token record');
      }
      const data = await res.json();
      setTokenStats(data);
    } catch (e) {
      setTrackError(e instanceof Error ? e.message : String(e) || 'Error tracking token');
      setTokenStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  // 1. Resolve active session from LocalStorage on mount
  useEffect(() => {
    const id = setTimeout(() => {
      const rawSession = localStorage.getItem('q-clinix-temp-session');
      if (rawSession) {
        try {
          const parsed = JSON.parse(rawSession) as TrackingSession;
          setSession(parsed);
          fetchQueueStats(parsed.tokenId);
        } catch (e) {
          console.error('Failed to parse local tracking session:', e);
        }
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const handleManualTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenIdInput.trim()) return;
    
    // Set local session for manual input tracking
    const manualSession = { tokenId: tokenIdInput.trim(), tokenNumber: 'Manual Input' };
    setSession(manualSession);
    fetchQueueStats(manualSession.tokenId);
  };

  // 3. Cancel queue token
  const handleCancelQueue = async () => {
    if (!session?.tokenId) return;
    if (!window.confirm('Are you sure you want to cancel your queue position?')) return;

    setCancelLoading(true);
    try {
      const res = await fetch('/api/queue/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: session.tokenId }),
      });

      if (res.ok) {
        alert('Your queue position has been cancelled.');
        localStorage.removeItem('q-clinix-temp-session');
        setSession(null);
        setTokenStats(null);
      } else {
        alert('Failed to cancel token.');
      }
    } catch {
      alert('Network error during cancellation.');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-xl mx-auto px-4 py-10 flex flex-col gap-6">
        
        {/* Back button */}
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-xs font-black text-text-muted hover:text-text-primary transition uppercase tracking-wider self-start"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Directory
        </button>

        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">Live Waitlist Tracker</h1>
          <p className="text-xs text-text-secondary mt-1 font-medium">
            Monitor real-time patient queue details and expected consultation timeframes.
          </p>
        </div>

        {/* Search Token Panel (if no active tracking session found) */}
        {!session && (
          <Card className="p-6 border border-border-subtle bg-bg-surface flex flex-col gap-4">
            <div>
              <h3 className="font-extrabold text-sm text-text-primary">Track Existing Ticket</h3>
              <p className="text-xs text-text-muted leading-relaxed font-semibold mt-1">
                Enter your unique queue token identification code below to restore track status.
              </p>
            </div>

            <form onSubmit={handleManualTrack} className="flex gap-2.5 mt-2">
              <input
                type="text"
                placeholder="Paste Token ID here..."
                value={tokenIdInput}
                onChange={(e) => setTokenIdInput(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs font-bold border border-border-subtle rounded-xl bg-bg-surface focus:outline-none focus:border-primary transition"
              />
              <Button type="submit" variant="primary" size="sm" className="bg-primary px-5 h-[40px]">
                Track Ticket
              </Button>
            </form>
          </Card>
        )}

        {/* Active Tracker Console Panel */}
        {session && (
          <div className="flex flex-col gap-6">
            
            {/* Header info */}
            <div className="flex justify-between items-center text-xs bg-bg-surface border border-border-subtle rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Badge variant="primary" className="text-[10px] font-black uppercase py-0.5 px-2 bg-primary/10 text-primary">
                  Token: {tokenStats?.tokenNumber || '...'}
                </Badge>
                <span className="text-text-muted font-bold">| Status: {tokenStats?.status || 'Resolving'}</span>
              </div>
              <button 
                onClick={() => fetchQueueStats(session.tokenId)}
                disabled={loadingStats}
                className="p-2 rounded-lg text-text-muted hover:bg-bg-muted transition flex items-center gap-1.5 font-bold"
              >
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loadingStats ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {/* Main status panel */}
            {tokenStats && (
              <Card className="flex flex-col gap-6">
                
                {/* Wait indicators grid */}
                <div className="grid grid-cols-2 gap-4 border-b border-border-subtle/50 pb-5">
                  <div className="flex flex-col items-center text-center py-2 bg-bg-muted/10 rounded-2xl border border-border-subtle/55">
                    <span className="text-[9px] font-black uppercase text-text-muted tracking-wider">Estimated Wait</span>
                    <span className="text-2xl font-black text-text-primary tracking-tight mt-1 flex items-center gap-1.5">
                      <Clock className="w-5 h-5 text-primary shrink-0" />
                      {tokenStats.estimatedWait ?? 0}m
                    </span>
                  </div>

                  <div className="flex flex-col items-center text-center py-2 bg-bg-muted/10 rounded-2xl border border-border-subtle/55">
                    <span className="text-[9px] font-black uppercase text-text-muted tracking-wider">Patients Ahead</span>
                    <span className="text-2xl font-black text-text-primary tracking-tight mt-1 flex items-center gap-1.5">
                      <Users className="w-5 h-5 text-primary shrink-0" />
                      {tokenStats.patientsAhead ?? 0}
                    </span>
                  </div>
                </div>

                {/* Progress bar wait track status */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-text-muted">
                    <span>Lobby Wait Progress</span>
                    <span>{tokenStats.status}</span>
                  </div>
                  
                  {/* Visual progress bar calculated based on wait list */}
                  <div className="w-full h-3 rounded-full bg-bg-muted overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        tokenStats.status === 'CALLED' ? 'bg-success' : 'bg-primary'
                      }`}
                      style={{ 
                        width: `${
                          tokenStats.status === 'CALLED' || tokenStats.status === 'IN_CONSULTATION'
                            ? 100 
                            : Math.max(5, Math.min(95, 100 - (tokenStats.patientsAhead || 0) * 15))
                        }%` 
                      }}
                    />
                  </div>
                </div>

                {/* Ticket summaries info */}
                <div className="p-4 rounded-xl border border-border-subtle bg-bg-muted/10 flex flex-col gap-2.5 text-xs font-semibold text-text-secondary leading-relaxed">
                  <div className="flex justify-between border-b border-border-subtle/40 pb-2">
                    <span className="text-text-muted">Clinic Center:</span>
                    <span className="text-text-primary font-bold">{tokenStats.clinicName}</span>
                  </div>
                  <div className="flex justify-between border-b border-border-subtle/40 pb-2">
                    <span className="text-text-muted">Physician Roster:</span>
                    <span className="text-text-primary font-bold">{tokenStats.doctorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Patient Name:</span>
                    <span className="text-text-primary font-bold">{tokenStats.patientName}</span>
                  </div>
                </div>

                {/* Rejoin / Cancel Action block */}
                <div className="flex flex-col sm:flex-row gap-3 border-t border-border-subtle/50 pt-5 mt-2">
                  <Button
                    onClick={() => {
                      localStorage.removeItem('q-clinix-temp-session');
                      setSession(null);
                      setTokenStats(null);
                    }}
                    variant="outline"
                    className="flex-1 text-xs font-black uppercase tracking-wider py-2.5 h-[40px]"
                  >
                    Untrack Token
                  </Button>

                  {/* Only allow cancellation if token is in WAITING state */}
                  {tokenStats.status === 'WAITING' && (
                    <Button
                      onClick={handleCancelQueue}
                      isLoading={cancelLoading}
                      variant="danger"
                      className="flex-1 text-xs font-black uppercase tracking-wider py-2.5 h-[40px] flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" /> Cancel Queue Slot
                    </Button>
                  )}
                </div>

              </Card>
            )}

            {/* Tracking error banner */}
            {trackError && (
              <div className="p-4 rounded-xl bg-danger-muted border border-danger/25 text-xs text-danger font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{trackError}</span>
              </div>
            )}

          </div>
        )}

      </div>
    </PublicLayout>
  );
}
