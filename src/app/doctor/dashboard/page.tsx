'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/dashboard/Header';
import { 
  CheckCircle, 
  SkipForward, 
  HelpCircle, 
  Pause, 
  Play, 
  Clock, 
  AlertOctagon, 
  Check, 
  Eye, 
  History, 
  FileText, 
  Activity,
  AlertCircle
} from 'lucide-react';

export default function DoctorDashboard() {
  const {
    doctors,
    queueTokens,
    visits,
    reports,
    currentUser,
    callNext,
    skipPatient,
    recallPatient,
    completeConsultation,
    pauseQueue,
    resumeQueue,
    addDelay,
    approveEmergency
  } = useApp();

  // Active doctor details
  const myDoctor = doctors.find(d => d.id === currentUser?.id) || doctors[0];
  const isPaused = myDoctor?.isActive === 'false';

  // State for Consultation Form
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');

  // Selected report to preview in overlay
  const [previewReport, setPreviewReport] = useState<any>(null);

  // Active token currently in consultation / called
  const activeToken = queueTokens.find(
    t => t.doctorId === myDoctor.id && ['CALLED', 'IN_CONSULTATION'].includes(t.status)
  );

  // Filter queue tokens for upcoming list
  const upcomingQueue = queueTokens
    .filter(t => t.doctorId === myDoctor.id && t.status === 'WAITING')
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

  // Completed today list
  const completedToday = queueTokens.filter(
    t => t.doctorId === myDoctor.id && t.status === 'COMPLETED'
  );

  // Pending emergency approvals (status WAITING, isEmergency is true, but priority is not yet approved level e.g. 1000)
  const pendingEmergencies = queueTokens.filter(
    t => t.doctorId === myDoctor.id && t.isEmergency && t.status === 'WAITING' && t.priority < 1000
  );

  const handleCallNext = () => {
    callNext(myDoctor.id);
    setDiagnosis('');
    setPrescription('');
    setNotes('');
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeToken) return;

    completeConsultation(
      activeToken.id,
      diagnosis || 'General check-up consultation completed',
      prescription,
      notes
    );

    setDiagnosis('');
    setPrescription('');
    setNotes('');
  };

  const handleSkip = () => {
    if (!activeToken) return;
    skipPatient(activeToken.id);
  };

  const handleRecall = () => {
    if (!activeToken) return;
    recallPatient(activeToken.id);
  };

  // Stats
  const completedCount = completedToday.length;
  const avgWait = myDoctor.averageConsultationTime;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Doctor Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight">{myDoctor.name} Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Consulting Room: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{myDoctor.roomNumber}</span> • Specialization: {myDoctor.specialization}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-semibold uppercase">Quick Controls:</span>
            {isPaused ? (
              <button
                onClick={() => resumeQueue(myDoctor.id)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Resume Queue
              </button>
            ) : (
              <button
                onClick={() => pauseQueue(myDoctor.id)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 transition"
              >
                <Pause className="w-3.5 h-3.5 fill-white" /> Pause Queue
              </button>
            )}

            <button
              onClick={() => addDelay(myDoctor.id, 10)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-50 flex items-center gap-1.5 transition"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-500" /> Add +10m Delay
            </button>
          </div>
        </div>

        {/* Pending Emergency Alert banner */}
        {pendingEmergencies.map((emg) => (
          <div key={emg.id} className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-bounce">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <span className="text-xs font-black text-rose-500 uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded mr-2">
                  Emergency Approval Requested
                </span>
                <span className="text-sm font-bold text-gray-800 dark:text-slate-200">
                  Patient {emg.patientName} (Token: {emg.tokenNumber}) flagged as EMERGENCY walk-in check.
                </span>
              </div>
            </div>
            <button
              onClick={() => approveEmergency(emg.id)}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Check className="w-3.5 h-3.5" /> Approve & Move to Next
            </button>
          </div>
        ))}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Active Consultation Panel */}
          <div className="lg:col-span-2 space-y-8">
            
            {activeToken ? (
              <div className="glass-panel p-6 border-indigo-100 dark:border-slate-800 dark:border-slate-800">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-850 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      Now Serving
                    </span>
                    <span className="text-2xl font-black text-gray-800 dark:text-slate-100">{activeToken.tokenNumber}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleSkip}
                      className="px-3 py-1.5 rounded-lg border border-gray-250 dark:border-slate-800 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-1"
                    >
                      <SkipForward className="w-3.5 h-3.5" /> Skip
                    </button>
                    <button
                      onClick={handleRecall}
                      className="px-3 py-1.5 rounded-lg border border-gray-250 dark:border-slate-800 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Recall Token
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="p-3.5 rounded-xl border border-gray-150 dark:border-slate-800 bg-slate-50/20">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Patient Name</div>
                    <div className="text-sm font-bold text-gray-800 dark:text-slate-100 mt-1">{activeToken.patientName}</div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-gray-150 dark:border-slate-800 bg-slate-50/20">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Demographics</div>
                    <div className="text-sm font-bold text-gray-800 dark:text-slate-100 mt-1">
                      {activeToken.patientAge} years • {activeToken.patientGender}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-gray-150 dark:border-slate-800 bg-slate-50/20">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Reason for Visit</div>
                    <div className="text-sm font-bold text-gray-800 dark:text-slate-100 mt-1 truncate" title={activeToken.reason}>
                      {activeToken.reason}
                    </div>
                  </div>
                </div>

                {/* Consultation Records / Form */}
                <form onSubmit={handleComplete} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Diagnosis / Medical Condition</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mild respiratory congestion, elevated cardiac risk..."
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Prescribed Medications (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Amoxicillin 500mg (3x daily), Acetaminophen as needed..."
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Consultation Notes / Advising</label>
                    <textarea
                      rows={3}
                      placeholder="Enter follow-up instructions, therapy options, exercise suggestions..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
                  >
                    Complete Consultation & Call Next
                  </button>
                </form>
              </div>
            ) : (
              <div className="glass-panel p-8 text-center border-dashed border-gray-200 dark:border-slate-800">
                <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-lg font-black text-gray-800 dark:text-slate-100">Ready to consult</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 max-w-xs mx-auto mb-6">
                  There are currently no patients active in your room. Select the button below to retrieve the next patient in queue.
                </p>
                <button
                  onClick={handleCallNext}
                  disabled={upcomingQueue.length === 0}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/10 hover:shadow-lg disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:text-gray-450 transition"
                >
                  Call Next Patient
                </button>
              </div>
            )}

            {/* Patient medical report folders and history log preview */}
            {activeToken && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Reports Upload Folder */}
                <div className="glass-panel p-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-500" /> Patient Medical Folders
                  </h3>
                  
                  {reports.filter(r => r.patientId === activeToken.patientId).length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400">No medical reports uploaded</div>
                  ) : (
                    <div className="space-y-3">
                      {reports.filter(r => r.patientId === activeToken.patientId).map((rep) => (
                        <div key={rep.id} className="p-3 rounded-xl border border-gray-150 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-900/40 flex items-center justify-between">
                          <div className="truncate pr-2">
                            <div className="text-xs font-bold text-gray-700 dark:text-slate-200 truncate">{rep.fileName}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{rep.reportType}</div>
                          </div>
                          
                          <button
                            onClick={() => setPreviewReport(rep)}
                            className="p-1 rounded text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 shrink-0"
                            title="Preview file"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Visit History Logs */}
                <div className="glass-panel p-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-500" /> Consultation History
                  </h3>
                  
                  {visits.filter(v => v.patientId === activeToken.patientId).length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400">No previous visits recorded</div>
                  ) : (
                    <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                      {visits.filter(v => v.patientId === activeToken.patientId).map((vis) => (
                        <div key={vis.id} className="p-2.5 rounded-lg border border-gray-150 dark:border-slate-850 bg-slate-50/20 text-xs">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-600 dark:text-slate-350">{vis.date}</span>
                            <span className="text-[10px] text-gray-400">{vis.doctorName}</span>
                          </div>
                          <div className="font-semibold text-gray-800 dark:text-slate-250 mt-1">Diagnosis: {vis.diagnosis}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">Notes: {vis.notes}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

          {/* Column 3: Upcoming Patient Queue & Stats */}
          <div className="space-y-8">
            
            {/* Quick Room statistics */}
            <div className="glass-panel p-5 grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-850/50 rounded-xl text-center border border-gray-150 dark:border-slate-800">
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Treated Today</div>
                <div className="text-2xl font-black text-gray-800 dark:text-slate-100 mt-1">{completedCount}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-850/50 rounded-xl text-center border border-gray-150 dark:border-slate-800">
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Avg. Wait</div>
                <div className="text-2xl font-black text-gray-800 dark:text-slate-100 mt-1">{avgWait}m</div>
              </div>
            </div>

            {/* Upcoming Patient queue cards */}
            <div className="glass-panel p-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Upcoming Patients Queue ({upcomingQueue.length})
              </h2>

              {upcomingQueue.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">Waiting room is empty</div>
              ) : (
                <div className="space-y-3">
                  {upcomingQueue.map((tok, index) => (
                    <div key={tok.id} className="p-3.5 rounded-xl border border-gray-150 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 flex items-center justify-between gap-3">
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            {tok.tokenNumber}
                          </span>
                          <span className="text-xs font-bold text-gray-700 dark:text-slate-200 truncate">{tok.patientName}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 truncate">
                          Est. Wait: {tok.estimatedWait}m • {tok.reason}
                        </div>
                      </div>

                      {index === 0 && (
                        <button
                          onClick={handleCallNext}
                          className="px-2.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] shrink-0 shadow-sm"
                        >
                          Call
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Patient Wait prediction tool tip */}
            <div className="p-4 rounded-xl ai-gradient-bg text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 w-16 h-16 rounded-full bg-white/10 blur-md pointer-events-none" />
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🤖</span>
                <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-100">AI wait Prediction</span>
              </div>
              <div className="text-sm font-semibold">Dr. {myDoctor.name.split(' ').pop()} consultation speed:</div>
              <div className="text-2xl font-black mt-1">1.2x Faster Today</div>
              <p className="text-[10px] text-indigo-100 mt-2.5 leading-relaxed">
                Our AI model has re-adjusted next 5 patient wait estimates down by -4 mins due to accelerated consult cycles.
              </p>
            </div>

          </div>

        </div>

      </main>

      {/* Floating Medical Document Preview Overlay (Lightbox popup) */}
      {previewReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-slide-up">
            <div className="px-5 py-4 border-b border-gray-150 dark:border-slate-850 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
              <div>
                <div className="text-xs text-gray-400 font-bold uppercase">Patient Medical Report Preview</div>
                <div className="text-sm font-bold mt-0.5 text-gray-800 dark:text-slate-100">{previewReport.fileName}</div>
              </div>
              <button
                onClick={() => setPreviewReport(null)}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-slate-350 bg-gray-100 dark:bg-slate-800 p-1 px-2.5 rounded-lg"
              >
                Close
              </button>
            </div>
            
            <div className="p-6 h-[320px] bg-slate-100/50 dark:bg-[#060814] flex flex-col items-center justify-center text-center">
              {previewReport.fileType === 'pdf' ? (
                <>
                  <FileText className="w-16 h-16 text-indigo-500 mb-3" />
                  <div className="text-xs font-semibold text-gray-700 dark:text-slate-200">Simulated blood_panel_march_2026.pdf Document</div>
                  <div className="text-[11px] text-gray-400 mt-1.5 max-w-sm">
                    Cholesterol: 180 mg/dL (Normal) • HbA1c: 5.4% (Normal) • RBC: 4.8 million/uL. Everything is within reference range.
                  </div>
                </>
              ) : (
                <>
                  <span className="text-6xl mb-3 filter drop-shadow">🩻</span>
                  <div className="text-xs font-semibold text-gray-700 dark:text-slate-200">Simulated chest_xray_cardio_check.png Image</div>
                  <div className="text-[11px] text-gray-400 mt-1.5 max-w-sm">
                    Visual examination displays normal cardiac contours and clean clear lungs. No signs of infection.
                  </div>
                </>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-150 dark:border-slate-850 flex justify-end gap-2 bg-gray-50/50 dark:bg-slate-900/50">
              <button
                onClick={() => setPreviewReport(null)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                Done Reviewing
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
