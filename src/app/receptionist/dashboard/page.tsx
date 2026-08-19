'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import type { QueueToken } from '@/lib/mockData';
import { 
  UserPlus, CalendarCheck, AlertTriangle, 
  Printer, Trash2, ChevronUp, ChevronDown, 
  UserX, Activity
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
    currentClinic,
    transferPatient,
    cancelPatientToken
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
  const [printedSlip, setPrintedSlip] = useState<QueueToken | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName || !walkInAge || !walkInPhone || !walkInDocId || !walkInReason) return;

    setRegisterLoading(true);
    try {
      const token = await registerWalkIn(
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
    } catch {
      alert('Failed to register walk-in patient.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handlePrint = (token: QueueToken) => {
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
    <RoleGuard roles={['RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN']}>
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        
        {/* Title bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">Reception Control Panel</h1>
            <p className="text-xs text-text-secondary mt-1 font-medium">
              Manage appointments check-in, register walk-ins, and orchestrate live doctor queues.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="max-w-[200px]"
              options={[
                { value: 'all', label: 'All Doctors' },
                ...doctors
                  .filter(d => d.clinicId === currentClinic?.id)
                  .map(d => ({ value: d.id, label: d.name }))
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Walk-In Registration Form */}
          <div className="flex flex-col gap-6">
            <Card className="flex flex-col gap-4">
              <h2 className="text-base font-extrabold text-text-primary tracking-tight flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-500" />
                Register Walk-In Patient
              </h2>
              
              <form onSubmit={handleWalkInSubmit} className="flex flex-col gap-4">
                <Input
                  label="Full Name"
                  required
                  placeholder="e.g. John Doe"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Age"
                    type="number"
                    required
                    placeholder="Age"
                    value={walkInAge}
                    onChange={(e) => setWalkInAge(e.target.value)}
                  />
                  <Select
                    label="Gender"
                    value={walkInGender}
                    onChange={(e) => setWalkInGender(e.target.value)}
                    options={[
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                      { value: 'Other', label: 'Other' }
                    ]}
                  />
                </div>

                <Input
                  label="Phone Number"
                  type="tel"
                  required
                  placeholder="e.g. +1 (555) 123-4567"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                />

                <Select
                  label="Assign Physician"
                  required
                  value={walkInDocId}
                  onChange={(e) => setWalkInDocId(e.target.value)}
                  options={[
                    { value: '', label: 'Choose Doctor...' },
                    ...doctors
                      .filter(d => d.clinicId === currentClinic?.id)
                      .map(d => ({ value: d.id, label: `${d.name} (${d.specialization})` }))
                  ]}
                />

                <Input
                  label="Reason for Visit"
                  required
                  placeholder="e.g. Flu symptoms, report review..."
                  value={walkInReason}
                  onChange={(e) => setWalkInReason(e.target.value)}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2"
                  isLoading={registerLoading}
                >
                  Generate Queue Token
                </Button>
              </form>
            </Card>

            {/* Token slip preview (printing slip) */}
            {printedSlip && (
              <Card className="bg-warning-muted border-warning/20 text-center animate-slide-up relative p-5 flex flex-col gap-3">
                <button 
                  onClick={() => setPrintedSlip(null)}
                  className="absolute right-3.5 top-3.5 text-xs text-text-muted hover:text-text-primary"
                >
                  ✕
                </button>
                <div className="text-text-muted text-[10px] uppercase font-black tracking-widest">Queue Slip Voucher</div>
                <div className="text-4xl font-black text-primary tracking-tight mt-1 animate-pulse">{printedSlip.tokenNumber}</div>
                <div className="text-xs font-extrabold text-text-primary mt-1">{printedSlip.patientName}</div>
                <div className="text-[10px] text-text-secondary leading-none font-medium">
                  Doctor: {doctors.find(d => d.id === printedSlip.doctorId)?.name}
                </div>
                <div className="text-[10px] text-text-muted">Estimated Wait: {printedSlip.estimatedWait} mins</div>
                <div className="border-t border-dashed border-border-subtle/50 my-1"></div>
                <button
                  onClick={() => { alert('Sending token details print instruction to clinic thermal printer...'); }}
                  className="text-[10px] font-bold text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Thermal Slip
                </button>
              </Card>
            )}

          </div>

          {/* Column 2: Scheduled Appointments Check-in Queue */}
          <div className="flex flex-col gap-6">
            <Card className="flex flex-col gap-4">
              <h2 className="text-base font-extrabold text-text-primary tracking-tight flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-primary" />
                Booked Appointments
              </h2>

              <Input
                isSearch
                placeholder="Search patient, doctor, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {filteredAppointments.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border-subtle rounded-xl text-text-muted text-xs">
                  No matching scheduled appointments.
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredAppointments.map((appt) => (
                    <div 
                      key={appt.id} 
                      className="p-3 rounded-xl border border-border-subtle bg-bg-surface flex items-center justify-between gap-3 hover:border-primary/25 transition"
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-bold text-text-primary truncate">{appt.patientName}</div>
                        <div className="text-[10px] text-text-muted mt-0.5 truncate font-medium">
                          {appt.doctorName} • {appt.reason}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          onClick={() => checkInAppointment(appt.id)}
                          variant="primary"
                          size="sm"
                          className="px-3 py-1.5 text-xs"
                        >
                          Check In
                        </Button>
                        <button
                          onClick={() => cancelAppointment(appt.id)}
                          className="p-1.5 rounded-lg text-danger hover:bg-danger-muted transition"
                          title="Cancel Booking"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Column 3: Live Queue List & Management controls */}
          <div className="flex flex-col gap-6">
            <Card className="flex flex-col gap-4">
              <h2 className="text-base font-extrabold text-text-primary tracking-tight flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <span>Live Wait List</span>
                </div>
                <Badge variant="primary" size="sm">
                  {activeQueues.length} Active
                </Badge>
              </h2>

              {activeQueues.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border-subtle rounded-xl text-text-muted text-xs">
                  No active patients in selected queues.
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {activeQueues
                    .sort((a, b) => {
                      if (a.status === 'IN_CONSULTATION') return -1;
                      if (b.status === 'IN_CONSULTATION') return 1;
                      if (a.status === 'CALLED') return -1;
                      if (b.status === 'CALLED') return 1;
                      return b.priority - a.priority || a.id.localeCompare(b.id);
                    })
                    .map((tok) => {
                      const doc = doctors.find(d => d.id === tok.doctorId);
                      const isEmergency = tok.isEmergency;
                      const isCalled = tok.status === 'CALLED';
                      const isConsulting = tok.status === 'IN_CONSULTATION';
                      
                      return (
                        <div 
                          key={tok.id} 
                          className={`p-3 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                            isConsulting 
                              ? 'border-success bg-success-muted' 
                              : isCalled 
                              ? 'border-warning bg-warning-muted animate-pulse' 
                              : 'border-border-subtle bg-bg-surface'
                          }`}
                        >
                          <div className="truncate w-full sm:w-auto">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant={isConsulting ? 'success' : isCalled ? 'warning' : 'primary'} size="sm">
                                {tok.tokenNumber}
                              </Badge>
                              <span className="text-xs font-bold text-text-primary truncate">{tok.patientName}</span>
                              {isEmergency && (
                                <span className="text-[9px] font-black text-danger bg-danger-muted px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-bounce">
                                  <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> EMG
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-text-muted mt-1 truncate font-medium">
                              Dr. {doc?.name.split(' ').pop()} • Room {doc?.roomNumber.split(' ').pop()}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Reorder Arrows */}
                            {tok.status === 'WAITING' && (
                              <div className="flex flex-col gap-0.5 shrink-0">
                                <button
                                  onClick={() => reorderQueue(tok.id, 'up')}
                                  className="p-0.5 hover:bg-bg-muted rounded text-text-muted hover:text-text-primary"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => reorderQueue(tok.id, 'down')}
                                  className="p-0.5 hover:bg-bg-muted rounded text-text-muted hover:text-text-primary"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {/* Print Voucher */}
                            <button
                              onClick={() => handlePrint(tok)}
                              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-muted"
                              title="Print slip"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Emergency toggle */}
                            <button
                              onClick={() => toggleEmergency(tok.id, !tok.isEmergency)}
                              className={`p-1.5 rounded-lg transition ${
                                tok.isEmergency 
                                  ? 'bg-danger-muted text-danger' 
                                  : 'text-text-secondary hover:text-danger hover:bg-danger-muted/30'
                              }`}
                              title={tok.isEmergency ? "Cancel Emergency" : "Flag Emergency"}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>

                             {/* Transfer Doctor */}
                             <select
                               value={tok.doctorId}
                               onChange={(e) => transferPatient(tok.id, e.target.value)}
                               className="text-xs bg-bg-surface border border-border-subtle rounded px-1.5 py-1 text-text-secondary focus:outline-none w-24 max-w-[90px]"
                               title="Transfer Doctor"
                             >
                               {doctors
                                 .filter(d => d.clinicId === currentClinic?.id)
                                 .map(d => (
                                   <option key={d.id} value={d.id}>
                                     Dr. {d.name.split(' ').pop()}
                                   </option>
                                 ))}
                             </select>

                             {/* Cancel Token */}
                             <button
                               onClick={() => {
                                 if (confirm('Cancel this patient token?')) cancelPatientToken(tok.id);
                               }}
                               className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-danger-muted/30"
                               title="Cancel Token"
                             >
                               <Trash2 className="w-3.5 h-3.5 text-danger" />
                             </button>

                             {/* Skip / No show */}
                             {tok.status !== 'IN_CONSULTATION' && (
                               <button
                                 onClick={() => markNoShow(tok.id)}
                                 className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-danger-muted/30"
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
            </Card>
          </div>

        </div>

      </div>
    </DashboardLayout>
    </RoleGuard>
  );
}
