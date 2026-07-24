'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/dashboard/Header';
import { 
  Calendar, 
  Clock, 
  FileText, 
  QrCode, 
  Upload, 
  CheckCircle2, 
  FileCheck, 
  ChevronRight, 
  Info,
  User,
  Activity,
  Plus
} from 'lucide-react';

export default function PatientDashboard() {
  const {
    doctors,
    appointments,
    queueTokens,
    visits,
    reports,
    currentUser,
    bookAppointment,
    checkInAppointment,
    uploadReport,
    currentClinic
  } = useApp();

  const [bookingDocId, setBookingDocId] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [reportFile, setReportFile] = useState<string | null>(null);
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState('Blood Test');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Filter current patient's data
  const myAppointments = appointments.filter(a => a.patientId === currentUser?.id);
  const myActiveToken = queueTokens.find(
    t => t.patientId === currentUser?.id && ['WAITING', 'CALLED', 'IN_CONSULTATION'].includes(t.status)
  );
  
  // Calculate how many patients are ahead in line
  const patientsAhead = myActiveToken
    ? queueTokens.filter(
        t => t.doctorId === myActiveToken.doctorId && 
             t.status === 'WAITING' && 
             t.priority >= myActiveToken.priority &&
             t.id < myActiveToken.id // FIFO tie-breaker
      ).length
    : 0;

  const activeDoctor = myActiveToken ? doctors.find(d => d.id === myActiveToken.doctorId) : null;

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDocId || !bookingReason || !bookingTime) return;
    
    bookAppointment(bookingDocId, bookingReason, new Date(bookingTime).toISOString());
    setBookingSuccess(true);
    setBookingDocId('');
    setBookingReason('');
    setBookingTime('');
    setTimeout(() => setBookingSuccess(false), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReportFile(file.name);
      setReportName(file.name);
    }
  };

  const submitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportName) return;
    const fileExt = reportName.split('.').pop() || 'pdf';
    const type: 'pdf' | 'image' = ['jpg', 'png', 'jpeg'].includes(fileExt.toLowerCase()) ? 'image' : 'pdf';
    uploadReport(reportName, reportType, type);
    setReportFile(null);
    setReportName('');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Banner */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="relative z-10">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
              Patient Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">Hello, {currentUser?.name}!</h1>
            <p className="text-sm text-indigo-100 mt-1 max-w-xl">
              Welcome to {currentClinic.name}. Monitor your queue position, book upcoming appointments, and upload documents for your physician.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Active Wait Telemetry and bookings */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Live Queue Status Board */}
            {myActiveToken ? (
              <div className="glass-panel p-6 border-indigo-100 dark:border-slate-800 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute right-6 top-6 animate-pulse-slow">
                  <span className="flex h-3.5 w-3.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="font-extrabold text-base uppercase tracking-tight text-gray-400">Live Wait Telemetry</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Big position callout */}
                  <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-slate-850/50 border border-indigo-50/50 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Your Ticket</span>
                    <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2 tracking-tight">
                      {myActiveToken.tokenNumber}
                    </span>
                    <span className="text-xs font-bold mt-2 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 capitalize">
                      {myActiveToken.status.replace('_', ' ').toLowerCase()}
                    </span>
                  </div>

                  {/* Estimated Wait */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850/30 border border-gray-150 dark:border-slate-800/80 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Estimated Wait</span>
                    <span className="text-3xl font-black mt-2 flex items-baseline gap-1 text-gray-800 dark:text-slate-100">
                      {myActiveToken.status === 'IN_CONSULTATION' ? '0' : myActiveToken.estimatedWait}
                      <span className="text-sm font-semibold text-gray-400">min</span>
                    </span>
                    <span className="text-[10px] text-gray-400 mt-2.5 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {myActiveToken.status === 'IN_CONSULTATION' ? 'In meeting' : `${patientsAhead} patients ahead`}
                    </span>
                  </div>

                  {/* Doctor & Room */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850/30 border border-gray-150 dark:border-slate-800/80 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Consultation Room</span>
                    <span className="text-2xl font-extrabold mt-2 text-gray-800 dark:text-slate-100">
                      {activeDoctor?.roomNumber || 'Room 101'}
                    </span>
                    <span className="text-xs text-gray-400 font-medium mt-2">
                      {activeDoctor?.name || 'Physician'}
                    </span>
                  </div>

                </div>

                {myActiveToken.status === 'CALLED' && (
                  <div className="mt-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold text-center animate-pulse">
                    🔔 Please proceed to {activeDoctor?.roomNumber} immediately! The doctor is waiting.
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-panel p-6 border-dashed border-gray-200 dark:border-slate-800 text-center py-8">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-850 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="font-extrabold text-base text-gray-700 dark:text-slate-200">No active queue entry</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                  You are not currently in the live queue. Check in below or book a future consultation.
                </p>
              </div>
            )}

            {/* Appointments check-in and booking list */}
            <div className="glass-panel p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Your Appointments
              </h2>
              
              {myAppointments.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">No scheduled appointments</div>
              ) : (
                <div className="space-y-4">
                  {myAppointments.map((appt) => (
                    <div key={appt.id} className="p-4 rounded-xl border border-gray-200/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 transition flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <div className="text-xs font-semibold text-gray-400">Physician</div>
                        <div className="text-sm font-bold text-gray-800 dark:text-slate-100">{appt.doctorName}</div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(appt.dateTime).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${appt.status === 'SCHEDULED' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {appt.status.replace('_', ' ')}
                        </span>
                        
                        {appt.status === 'SCHEDULED' && !myActiveToken && (
                          <button
                            onClick={() => checkInAppointment(appt.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-500/15 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition"
                          >
                            Check In
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Book Appointment Form */}
            <div className="glass-panel p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Book Consultation
              </h2>
              
              {bookingSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Appointment booked successfully! Check details above.
                </div>
              )}

              <form onSubmit={handleBook} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Select Doctor</label>
                  <select
                    required
                    value={bookingDocId}
                    onChange={(e) => setBookingDocId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-sky-500"
                  >
                    <option value="">Choose Physician...</option>
                    {doctors.filter(d => d.clinicId === currentClinic.id).map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Appointment Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-sky-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Reason for Visit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Regular high-blood pressure check, prescription extension..."
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  className="md:col-span-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
                >
                  Book Appointment
                </button>
              </form>
            </div>

          </div>

          {/* Column 3: Check-in QR and Uploads */}
          <div className="space-y-8">
            
            {/* Quick QR Check-in Box */}
            <div className="glass-panel p-6 text-center bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-400 flex items-center justify-center gap-1.5 mb-4">
                <QrCode className="w-4 h-4 text-indigo-600" /> Clinic Check-In Kiosk
              </h2>
              <div className="w-40 h-40 bg-white p-3 rounded-2xl mx-auto border border-gray-150 shadow-sm flex items-center justify-center relative group">
                <span className="text-8xl select-none filter opacity-90 transition group-hover:scale-105 duration-300">📱</span>
                {/* Simulated scan lasers */}
                <div className="absolute left-0 right-0 h-0.5 bg-indigo-500 top-1/2 -translate-y-1/2 animate-pulse pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-4 leading-normal">
                Scan this card at the clinic check-in terminal to automatically verify your profile, check in, and obtain your token.
              </p>
              <div className="mt-3 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                ID: {currentUser?.id}
              </div>
            </div>

            {/* Medical Reports Upload Dropzone */}
            <div className="glass-panel p-6">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-4">
                <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Upload Reports
              </h2>
              
              <form onSubmit={submitReport} className="space-y-4">
                {reportFile ? (
                  <div className="p-4 rounded-xl border border-dashed border-emerald-500 bg-emerald-500/5 text-center">
                    <FileCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <div className="text-xs font-bold text-gray-700 dark:text-slate-200 truncate">{reportFile}</div>
                    <button 
                      onClick={() => setReportFile(null)} 
                      type="button"
                      className="text-[10px] text-rose-500 underline mt-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="block p-6 rounded-xl border border-dashed border-gray-250 dark:border-slate-800 hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-900/50 text-center cursor-pointer transition">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-slate-350">Drag file or click to browse</span>
                    <input 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg" 
                      className="hidden" 
                      onChange={handleFileUpload} 
                    />
                  </label>
                )}

                {reportFile && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Rename File</label>
                      <input
                        type="text"
                        required
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-250 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Report Category</label>
                      <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-250 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                      >
                        <option value="Blood Test">Blood Panel</option>
                        <option value="X-Ray">X-Ray Scans</option>
                        <option value="MRI">MRI Scan</option>
                        <option value="CT Scan">CT Scan</option>
                        <option value="Lab Report">Laboratory Report</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
                    >
                      Share with Doctor
                    </button>
                  </>
                )}
              </form>

              {/* Uploaded List */}
              <div className="mt-6 border-t border-gray-100 dark:border-slate-850 pt-4">
                <div className="text-xs font-bold text-gray-400 uppercase mb-3">Recently Shared ({reports.length})</div>
                <div className="space-y-3">
                  {reports.map((rep) => (
                    <div key={rep.id} className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 dark:bg-slate-900/60 border border-gray-150 dark:border-slate-850">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div className="truncate">
                          <div className="font-semibold text-gray-700 dark:text-slate-200 truncate">{rep.fileName}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{rep.reportType}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-gray-400 shrink-0">{rep.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Visit History Log */}
            <div className="glass-panel p-6">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Previous Consultations
              </h2>
              
              <div className="space-y-4">
                {visits.filter(v => v.patientId === currentUser?.id).map((vis) => (
                  <div key={vis.id} className="p-3 rounded-xl border border-gray-150 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-700 dark:text-slate-200">{vis.doctorName}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{vis.date}</span>
                    </div>
                    <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mt-1">
                      Diag: {vis.diagnosis}
                    </div>
                    
                    <div className="mt-2 border-t border-gray-100 dark:border-slate-850/50 pt-2">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Prescribed</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {vis.prescription.map((med, mIdx) => (
                          <span key={mIdx} className="text-[9px] font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-350 border border-gray-150 dark:border-slate-750">
                            {med}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
