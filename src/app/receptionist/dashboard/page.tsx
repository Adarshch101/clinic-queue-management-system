'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/dashboard/Header';
import { 
  Users, 
  UserPlus, 
  CalendarCheck, 
  AlertTriangle, 
  Printer, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Play, 
  Pause,
  UserX,
  Plus,
  RefreshCw,
  Search
} from 'lucide-react';

export default function ReceptionistDashboard() {
  const {
    doctors,
    appointments,
    queueTokens,
    registerWalkIn,
    checkInAppointment,
    reorderQueue,
    toggleEmergency,
    cancelAppointment,
    markNoShow,
    currentClinic
  } = useApp();

  // State for Walk-In form
  const [walkInName, setWalkInName] = useState('');
  const [walkInAge, setWalkInAge] = useState('');
  const [walkInGender, setWalkInGender] = useState('Male');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInDocId, setWalkInDocId] = useState('');
  const [walkInReason, setWalkInReason] = useState('');
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  
  // Doctor filter for queue lists
  const [selectedDoctorId, setSelectedDoctorId] = useState('all');

  // Print slip state
  const [printedSlip, setPrintedSlip] = useState<any>(null);

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName || !walkInAge || !walkInPhone || !walkInDocId || !walkInReason) return;

    const token = registerWalkIn(
      walkInName,
      parseInt(walkInAge),
      walkInGender,
      walkInPhone,
      walkInDocId,
      walkInReason
    );

    // Trigger printed ticket slip preview
    setPrintedSlip(token);

    // Reset Form
    setWalkInName('');
    setWalkInAge('');
    setWalkInPhone('');
    setWalkInDocId('');
    setWalkInReason('');
  };

  const handlePrint = (token: any) => {
    setPrintedSlip(token);
  };

  // Filter appointments for check-in search
  const filteredAppointments = appointments.filter(appt => {
    const query = searchQuery.toLowerCase();
    return appt.status === 'SCHEDULED' && 
      (appt.patientName.toLowerCase().includes(query) || 
       appt.doctorName.toLowerCase().includes(query) ||
       appt.reason.toLowerCase().includes(query));
  });

  // Filter queues
  const activeQueues = queueTokens.filter(tok => {
    const isDoctorMatch = selectedDoctorId === 'all' || tok.doctorId === selectedDoctorId;
    return isDoctorMatch && ['WAITING', 'CALLED', 'IN_CONSULTATION'].includes(tok.status);
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Reception Title bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Reception Control Panel</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Manage appointments check-in, register walk-ins, and orchestrate live doctor queues.
            </p>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
            >
              <option value="all">All Doctors Queues</option>
              {doctors.filter(d => d.clinicId === currentClinic.id).map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Walk-In Registration Form */}
          <div className="space-y-8">
            <div className="glass-panel p-6">
              <h2 className="text-base font-extrabold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                Register Walk-In Patient
              </h2>
              
              <form onSubmit={handleWalkInSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-250 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Age</label>
                    <input
                      type="number"
                      required
                      placeholder="Age"
                      value={walkInAge}
                      onChange={(e) => setWalkInAge(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-250 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Gender</label>
                    <select
                      value={walkInGender}
                      onChange={(e) => setWalkInGender(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-250 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +1 (555) 123-4567"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-250 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Assign Physician</label>
                  <select
                    required
                    value={walkInDocId}
                    onChange={(e) => setWalkInDocId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-250 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                  >
                    <option value="">Select Doctor...</option>
                    {doctors.filter(d => d.clinicId === currentClinic.id).map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Reason for Visit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fever check, prescription refill..."
                    value={walkInReason}
                    onChange={(e) => setWalkInReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-250 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/10 transition"
                >
                  Generate Queue Token
                </button>
              </form>
            </div>

            {/* Token slip preview (mock printing slip) */}
            {printedSlip && (
              <div className="glass-panel p-5 bg-amber-500/5 border-amber-500/20 text-center animate-slide-up relative">
                <div className="absolute right-3 top-3">
                  <button 
                    onClick={() => setPrintedSlip(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-350"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Queue Slip Voucher</div>
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-2">{printedSlip.tokenNumber}</div>
                <div className="text-xs font-semibold text-gray-800 dark:text-slate-200 mt-2">{printedSlip.patientName}</div>
                <div className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">
                  Doctor: {doctors.find(d => d.id === printedSlip.doctorId)?.name}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Estimated Wait: {printedSlip.estimatedWait} mins</div>
                <div className="border-t border-dashed border-gray-250 dark:border-slate-850 my-3"></div>
                <button
                  onClick={() => { alert('Sending token details print instruction to clinic thermal printer...'); }}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mx-auto"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Thermal Slip
                </button>
              </div>
            )}

          </div>

          {/* Column 2: Scheduled Appointments Check-in Queue */}
          <div className="space-y-8">
            <div className="glass-panel p-6">
              <h2 className="text-base font-extrabold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Booked Appointments
              </h2>

              <div className="relative mb-4">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patient, doctor, reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 text-xs focus:outline-none"
                />
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">No matching appointments waiting check-in</div>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto">
                  {filteredAppointments.map((appt) => (
                    <div key={appt.id} className="p-3 rounded-xl border border-gray-150 dark:border-slate-850 bg-white/40 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 transition flex items-center justify-between gap-3">
                      <div className="truncate pr-2">
                        <div className="text-xs font-bold text-gray-700 dark:text-slate-200 truncate">{appt.patientName}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                          {appt.doctorName} • {appt.reason}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => checkInAppointment(appt.id)}
                          className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] transition"
                        >
                          Check In
                        </button>
                        <button
                          onClick={() => cancelAppointment(appt.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition"
                          title="Cancel Booking"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Live Queue List & Management controls */}
          <div className="space-y-8">
            <div className="glass-panel p-6">
              <h2 className="text-base font-extrabold text-gray-800 dark:text-slate-100 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Live Wait List</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {activeQueues.length} Active
                </span>
              </h2>

              {activeQueues.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-400">No active patients in selected queues</div>
              ) : (
                <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                  {activeQueues
                    .sort((a, b) => {
                      if (a.status === 'IN_CONSULTATION') return -1;
                      if (b.status === 'IN_CONSULTATION') return 1;
                      if (a.status === 'CALLED') return -1;
                      if (b.status === 'CALLED') return 1;
                      // Otherwise sort by priority then FIFO
                      return b.priority - a.priority || a.id.localeCompare(b.id);
                    })
                    .map((tok) => {
                      const doc = doctors.find(d => d.id === tok.doctorId);
                      return (
                        <div 
                          key={tok.id} 
                          className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${tok.status === 'IN_CONSULTATION' ? 'border-emerald-500 bg-emerald-500/5' : tok.status === 'CALLED' ? 'border-amber-500 bg-amber-500/5 animate-pulse' : 'border-gray-150 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50'}`}
                        >
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${tok.status === 'IN_CONSULTATION' ? 'bg-emerald-500/10 text-emerald-500' : tok.status === 'CALLED' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
                                {tok.tokenNumber}
                              </span>
                              <span className="text-xs font-bold text-gray-800 dark:text-slate-200 truncate">{tok.patientName}</span>
                              {tok.isEmergency && (
                                <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-1 py-0.5 rounded flex items-center gap-0.5 animate-bounce">
                                  <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> EMG
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1 truncate">
                              Dr. {doc?.name.split(' ').pop()} • Room {doc?.roomNumber.split(' ').pop()}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Reorder Arrows */}
                            {tok.status === 'WAITING' && (
                              <div className="flex flex-col gap-0.5">
                                <button
                                  onClick={() => reorderQueue(tok.id, 'up')}
                                  className="p-0.5 hover:bg-gray-150 dark:hover:bg-slate-805 rounded text-gray-400 hover:text-gray-600"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => reorderQueue(tok.id, 'down')}
                                  className="p-0.5 hover:bg-gray-150 dark:hover:bg-slate-805 rounded text-gray-400 hover:text-gray-600"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {/* Print Voucher */}
                            <button
                              onClick={() => handlePrint(tok)}
                              className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                              title="Print ticket voucher"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Emergency toggle */}
                            <button
                              onClick={() => toggleEmergency(tok.id, !tok.isEmergency)}
                              className={`p-1.5 rounded transition ${tok.isEmergency ? 'bg-rose-500/15 text-rose-500' : 'text-gray-400 hover:text-rose-500 hover:bg-rose-500/5'}`}
                              title={tok.isEmergency ? "Cancel Emergency" : "Flag Emergency priority"}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>

                            {/* Skip / No show */}
                            {tok.status !== 'IN_CONSULTATION' && (
                              <button
                                onClick={() => markNoShow(tok.id)}
                                className="p-1.5 rounded text-gray-400 hover:text-rose-500 hover:bg-rose-500/5"
                                title="Mark No-Show"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
