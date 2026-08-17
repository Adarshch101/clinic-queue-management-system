'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/Badge';
import type { QueueToken } from '@/lib/mockData';
import { Volume2, VolumeX, Activity, ArrowRight, HeartPulse } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TvDisplayScreen() {
  const { queueTokens, doctors, triggerVoiceAnnouncement } = useApp();
  
  // Track sound enable/disable (browsers block autoplay speech without interaction)
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Keep track of previously called token IDs to know when to trigger the alarm/voice
  const [lastCalledToken, setLastCalledToken] = useState<string | null>(null);
  
  // Flash animation state
  const [flashActive, setFlashActive] = useState(false);
  const [flashToken, setFlashToken] = useState<QueueToken | null>(null);

  // Filter tokens currently in CALLED state
  const activeServing = queueTokens.filter(t => t.status === 'CALLED');

  // Next 5 waiting tokens
  const nextWaiting = queueTokens
    .filter(t => t.status === 'WAITING')
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
    .slice(0, 5);

  // Check for newly called tickets to run announcements
  useEffect(() => {
    let flashTimer: ReturnType<typeof setTimeout> | null = null;
    const id = setTimeout(() => {
      if (activeServing.length > 0) {
        const latestCalled = activeServing[activeServing.length - 1];

        if (lastCalledToken !== latestCalled.id) {
          setLastCalledToken(latestCalled.id);
          setFlashToken(latestCalled);

          // Trigger flashing screen alert
          setFlashActive(true);
          flashTimer = setTimeout(() => setFlashActive(false), 5000); // flash for 5 seconds

          // Voice announcement
          if (soundEnabled) {
            const docObj = doctors.find(d => d.id === latestCalled.doctorId);
            const room = docObj?.roomNumber || 'Room 101';
            const text = `Ticket number ${latestCalled.tokenNumber}, please proceed to ${room}.`;
            triggerVoiceAnnouncement(text);
          }
        }
      }
    }, 0);

    return () => {
      clearTimeout(id);
      if (flashTimer) clearTimeout(flashTimer);
    };
  }, [activeServing, lastCalledToken, soundEnabled, doctors, triggerVoiceAnnouncement]);

  return (
    <div className={`flex flex-col min-h-screen bg-[#03040b] text-slate-100 p-6 sm:p-8 transition-all duration-500 ${
      flashActive ? 'ring-8 ring-indigo-500 bg-slate-950 shadow-inner' : ''
    }`}>
      
      {/* TV Screen Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center border-b border-slate-800 pb-5 mb-8 gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl shadow shadow-indigo-500/30 shrink-0">
            Q
          </span>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Waiting Lobby Display Board
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-bold">Real-time Patient Token Coordinates</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound Autoplay Interaction Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition focus:outline-none ${
              soundEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4" /> Voice Alerts: Enabled
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-rose-500 animate-pulse" /> Voice Alerts: Muted (Click to Enable)
              </>
            )}
          </button>

          <div className="flex items-center gap-2 text-[10px] font-black bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-slate-300 uppercase tracking-widest shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>WebSocket Live</span>
          </div>
        </div>
      </header>

      {/* Main Grid: NOW SERVING (Left) & UPCOMING (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        
        {/* NOW SERVING BOARDS (Col 1 & 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1 flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-indigo-500" /> NOW SERVING
          </div>

          {activeServing.length === 0 ? (
            <div className="flex-1 rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 flex flex-col items-center justify-center text-center p-8">
              <span className="text-5xl filter opacity-80 mb-4 select-none">ðŸ¥</span>
              <h3 className="text-lg font-bold text-slate-300">All Consultation Rooms Clear</h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed font-semibold">
                Doctors are currently updating records. Next tickets will appear shortly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
              <AnimatePresence>
                {activeServing.map((tok) => {
                  const doc = doctors.find(d => d.id === tok.doctorId);
                  const isLatest = flashActive && flashToken?.id === tok.id;
                  
                  return (
                    <motion.div 
                      key={tok.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-6 rounded-3xl border bg-[#090b11] transition flex flex-col justify-between ${
                        isLatest ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg' : 'border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-800/80 pb-3 mb-4">
                        <span>ROOM INDICATOR</span>
                        <Badge variant="primary" className="bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
                          {doc?.roomNumber}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Physician</div>
                        <div className="text-xl font-black text-white">{doc?.name}</div>
                        <div className="text-xs text-slate-400 mt-1 font-semibold">{doc?.specialization}</div>
                      </div>

                      <div className="mt-8 text-center bg-[#03040b] rounded-2xl py-6 border border-slate-800/80 shadow-inner">
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">TICKET CODE</div>
                        <div className="text-5xl sm:text-6xl font-black text-indigo-500 tracking-tight mt-2 animate-pulse">
                          {tok.tokenNumber}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* UPCOMING TICKETS (Col 3) */}
        <div className="flex flex-col gap-6">
          <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1 flex items-center gap-2">
            <HeartPulse className="w-4.5 h-4.5 text-indigo-500" /> NEXT IN LINE
          </div>

          <div className="flex-1 rounded-3xl border border-slate-800 bg-[#090b11]/80 p-6 flex flex-col justify-between">
            {nextWaiting.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500 font-semibold">
                Waiting room queue is currently empty.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {nextWaiting.map((tok) => {
                  const doc = doctors.find(d => d.id === tok.doctorId);
                  return (
                    <div key={tok.id} className="p-4 rounded-2xl bg-[#03040b] border border-slate-800 flex items-center justify-between gap-3">
                      <div className="truncate">
                        <div className="text-xl font-black text-white tracking-tight">{tok.tokenNumber}</div>
                        <div className="text-[10px] text-slate-500 mt-1 font-semibold truncate">
                          Room: {doc?.roomNumber.split(' ').pop()} â€¢ Dr. {doc?.name.split(' ').pop()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800 shrink-0">
                        <span>Next</span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TV Banner Footer */}
            <div className="border-t border-slate-800 pt-5 mt-6 text-center text-slate-500 text-[10px] uppercase font-bold tracking-wider leading-relaxed">
              CareFirst Clinic: Digital Queue Systems <br />
              <span className="text-[9px] text-slate-600 font-bold lowercase">Wear a mask if coughing â€¢ Sanitize your hands</span>
            </div>
          </div>

        </div>

      </div>

      {/* Screen Announcement Flash Banner (Overlay) */}
      <AnimatePresence>
        {flashActive && flashToken && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-50 bg-indigo-600 text-white px-8 py-5 rounded-2xl shadow-2xl border border-indigo-400 max-w-md w-full flex items-center gap-4"
          >
            <div className="text-3xl animate-bounce shrink-0">ðŸ””</div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-widest opacity-80">Now Calling Token</div>
              <div className="text-3xl font-black mt-0.5 tracking-tight">{flashToken.tokenNumber}</div>
              <div className="text-xs mt-1.5 opacity-90 font-medium">
                Please proceed to Room: <span className="font-extrabold">{doctors.find(d => d.id === flashToken.doctorId)?.roomNumber}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
