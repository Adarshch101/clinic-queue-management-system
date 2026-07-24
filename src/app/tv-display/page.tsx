'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Tv, 
  UserCheck, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  Activity,
  HeartPulse
} from 'lucide-react';

export default function TvDisplayScreen() {
  const { queueTokens, doctors, triggerVoiceAnnouncement } = useApp();
  
  // Track sound enable/disable (browsers block autoplay speech without interaction)
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Keep track of previously called token IDs to know when to trigger the alarm/voice
  const [lastCalledToken, setLastCalledToken] = useState<string | null>(null);
  
  // Flash animation state
  const [flashActive, setFlashActive] = useState(false);
  const [flashToken, setFlashToken] = useState<any>(null);

  // Filter tokens currently in CALLED state
  const activeServing = queueTokens.filter(t => t.status === 'CALLED');

  // Next 5 waiting tokens
  const nextWaiting = queueTokens
    .filter(t => t.status === 'WAITING')
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
    .slice(0, 5);

  // Check for newly called tickets to run announcements
  useEffect(() => {
    if (activeServing.length > 0) {
      const latestCalled = activeServing[activeServing.length - 1];
      
      if (lastCalledToken !== latestCalled.id) {
        setLastCalledToken(latestCalled.id);
        setFlashToken(latestCalled);
        
        // Trigger flashing screen alert
        setFlashActive(true);
        const timer = setTimeout(() => setFlashActive(false), 5000); // flash for 5 seconds

        // Voice announcement
        if (soundEnabled) {
          const docObj = doctors.find(d => d.id === latestCalled.doctorId);
          const room = docObj?.roomNumber || 'Room 101';
          const text = `Ticket number ${latestCalled.tokenNumber}, please proceed to ${room}.`;
          triggerVoiceAnnouncement(text);
        }

        return () => clearTimeout(timer);
      }
    }
  }, [activeServing, lastCalledToken, soundEnabled, doctors, triggerVoiceAnnouncement]);

  return (
    <div className={`flex flex-col min-h-screen bg-[#060814] text-slate-100 p-8 transition-colors duration-500 ${flashActive ? 'ring-8 ring-blue-500 animate-pulse bg-slate-900' : ''}`}>
      
      {/* TV Screen Header */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl shadow shadow-indigo-500/30">
            Q
          </span>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Waiting Room Lobby Board
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Real-time Patient Token Coordinates</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Sound Autoplay Interaction Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${soundEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4" /> Voice Alerts: Enabled
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-rose-500" /> Voice Alerts: Muted (Click to Enable)
              </>
            )}
          </button>

          <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-350 font-bold uppercase tracking-wider">WebSocket Live Connection</span>
          </div>
        </div>
      </header>

      {/* Main Grid: NOW SERVING (Left) & UPCOMING (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        
        {/* NOW SERVING BOARDS (Col 1 & 2) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          <div className="text-xs uppercase font-extrabold tracking-widest text-slate-500 mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" /> NOW SERVING
          </div>

          {activeServing.length === 0 ? (
            <div className="flex-1 rounded-3xl border border-dashed border-slate-800 bg-slate-900/20 flex flex-col items-center justify-center text-center p-8">
              <span className="text-5xl filter opacity-80 mb-4">🏥</span>
              <h3 className="text-xl font-bold text-slate-300">All Consulting Rooms Clear</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                Doctors are currently updating records. Next tickets will appear shortly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
              {activeServing.map((tok) => {
                const doc = doctors.find(d => d.id === tok.doctorId);
                return (
                  <div 
                    key={tok.id} 
                    className={`p-6 rounded-3xl border bg-slate-900/60 transition flex flex-col justify-between ${flashActive && flashToken?.id === tok.id ? 'border-indigo-500 ring-2 ring-blue-500/20 glow-primary bg-slate-900' : 'border-slate-800'}`}
                  >
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-400 font-bold border-b border-slate-800/80 pb-3 mb-4">
                        <span>ROOM INDICATOR</span>
                        <span className="text-indigo-500">{doc?.roomNumber}</span>
                      </div>
                      
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Physician</div>
                      <div className="text-xl font-black text-white mt-0.5">{doc?.name}</div>
                      <div className="text-xs text-slate-500 mt-1.5">{doc?.specialization}</div>
                    </div>

                    <div className="mt-8 text-center bg-[#060814]/80 rounded-2xl py-6 border border-slate-800/60">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">TICKET CODE</div>
                      <div className="text-5xl sm:text-6xl font-black text-indigo-500 tracking-tight mt-2 animate-pulse">
                        {tok.tokenNumber}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* UPCOMING TICKETS (Col 3) */}
        <div className="space-y-6 flex flex-col">
          <div className="text-xs uppercase font-extrabold tracking-widest text-slate-500 mb-2 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-indigo-500" /> NEXT IN LINE
          </div>

          <div className="flex-1 rounded-3xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between">
            {nextWaiting.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">
                Waiting room queue is currently empty.
              </div>
            ) : (
              <div className="space-y-4">
                {nextWaiting.map((tok) => {
                  const doc = doctors.find(d => d.id === tok.doctorId);
                  return (
                    <div key={tok.id} className="p-4 rounded-2xl bg-[#060814]/60 border border-slate-850 flex items-center justify-between">
                      <div>
                        <div className="text-xl font-black text-white tracking-tight">{tok.tokenNumber}</div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Room: {doc?.roomNumber.split(' ').pop()} • Dr. {doc?.name.split(' ').pop()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                        <span>Next</span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Simulated TV Banner Footer advertisement */}
            <div className="border-t border-slate-800 pt-6 mt-6 text-center text-slate-500 text-[10px] uppercase font-bold tracking-widest leading-relaxed">
              CareFirst Clinic: Digital Queue Systems <br />
              <span className="text-[9px] text-slate-600 font-medium">Wear a mask if coughing • Wash your hands</span>
            </div>
          </div>

        </div>

      </div>

      {/* Screen Announcement Flash Banner */}
      {flashActive && flashToken && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-8 py-5 rounded-2xl shadow-2xl border border-blue-400 max-w-lg w-full flex items-center gap-4 animate-slide-up">
          <div className="text-3xl animate-bounce">🔔</div>
          <div>
            <div className="text-xs uppercase font-extrabold tracking-widest opacity-80">Now Calling Token</div>
            <div className="text-3xl font-black mt-0.5 tracking-tight">{flashToken.tokenNumber}</div>
            <div className="text-xs mt-1.5 opacity-90">
              Please proceed to Room: <span className="font-bold">{doctors.find(d => d.id === flashToken.doctorId)?.roomNumber}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
