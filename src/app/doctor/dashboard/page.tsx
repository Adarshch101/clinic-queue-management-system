'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import type { Doctor, MedicalReport } from '@/lib/mockData';
import { validateRequired, hasErrors, type ValidationErrors } from '@/lib/validation';
import { 
  SkipForward, HelpCircle, Pause, Play, 
  Clock, AlertOctagon, Check, Eye, History, FileText, 
  Activity 
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
    approveEmergency,
    callPrevious,
    transferPatient,
    cancelPatientToken,
    fetchPatientRecords
  } = useApp();

  const { hasPermission } = useAuth();

  // Transfer/cancel are operations functions reserved for clinic managers.
  const canManageOps = hasPermission('MANAGE_CLINIC');

  // Active doctor details. The signed-in user's Doctor record id differs from
  // the Supabase auth userId, so resolve it via /api/doctor/me (record id),
  // fall back to a userId match in the directory, then the first doctor
  // (admins previewing the page have no Doctor row).
  const [myDoctorRecord, setMyDoctorRecord] = useState<Doctor | null>(null);
  const myDoctor =
    doctors.find(d => d.id === myDoctorRecord?.id) ||
    myDoctorRecord ||
    doctors.find(d => d.id === currentUser?.id) ||
    doctors[0];
  const isPaused = myDoctor?.isActive === 'false';

  // State for Consultation Form
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [consultErrors, setConsultErrors] = useState<ValidationErrors>({});

  // Selected report to preview in overlay modal
  const [previewReport, setPreviewReport] = useState<MedicalReport | null>(null);
  
  const [actionLoading, setActionLoading] = useState(false);

  // Active token currently in consultation / called
  const activeToken = queueTokens.find(
    t => t.doctorId === myDoctor.id && ['CALLED', 'IN_CONSULTATION'].includes(t.status)
  );

  // Load the active patient's medical records when a token becomes active.
  useEffect(() => {
    if (activeToken?.patientId) {
      fetchPatientRecords(activeToken.patientId);
    }
  }, [activeToken?.patientId, fetchPatientRecords]);

  // Resolve the signed-in doctor's record id from the session.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/doctor/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (cancelled || !me) return;
        setMyDoctorRecord({
          id: me.id,
          clinicId: me.clinicId,
          name: me.name,
          specialization: me.specialization,
          roomNumber: me.roomNumber,
          email: me.email || '',
          phone: me.phone || '',
          avatar: me.avatar || '',
          workingHours: '',
          averageConsultationTime: me.averageConsultationTime,
          isActive: me.isActive,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!myDoctor) {
    return (
      <RoleGuard roles={['DOCTOR', 'ADMIN', 'SUPER_ADMIN']}>
        <DashboardLayout>
          <div className="p-8 text-sm text-text-muted">
            No doctor profile was found for your account. Contact your clinic administrator.
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  // Filter queue tokens for upcoming list
  const upcomingQueue = queueTokens
    .filter(t => t.doctorId === myDoctor.id && t.status === 'WAITING')
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

  // Completed today list
  const completedToday = queueTokens.filter(
    t => t.doctorId === myDoctor.id && t.status === 'COMPLETED'
  );

  // Pending emergency approvals
  const pendingEmergencies = queueTokens.filter(
    t => t.doctorId === myDoctor.id && t.isEmergency && t.status === 'WAITING' && t.priority < 1000
  );

  const handleCallNext = async () => {
    setActionLoading(true);
    try {
      await callNext(myDoctor.id);
      setDiagnosis('');
      setPrescription('');
      setNotes('');
    } catch {
      alert('Failed to call next patient.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeToken) return;

    const errors: ValidationErrors = {
      diagnosis: validateRequired(diagnosis, 'Diagnosis'),
    };
    if (hasErrors(errors)) {
      setConsultErrors(errors);
      return;
    }
    setConsultErrors({});

    setActionLoading(true);
    try {
      await completeConsultation(
        activeToken.id,
        diagnosis.trim(),
        prescription,
        notes
      );
      setDiagnosis('');
      setPrescription('');
      setNotes('');
    } catch {
      alert('Failed to complete consultation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!activeToken) return;
    setActionLoading(true);
    try {
      await skipPatient(activeToken.id);
    } catch {
      alert('Failed to skip patient.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecall = async () => {
    if (!activeToken) return;
    setActionLoading(true);
    try {
      await recallPatient(activeToken.id);
    } catch {
      alert('Failed to recall patient.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await pauseQueue(myDoctor.id);
    } catch {
      alert('Failed to pause queue.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await resumeQueue(myDoctor.id);
    } catch {
      alert('Failed to resume queue.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddDelay = async () => {
    setActionLoading(true);
    try {
      await addDelay(myDoctor.id, 10);
    } catch {
      alert('Failed to add delay.');
    } finally {
      setActionLoading(false);
    }
  };

  // Stats
  const completedCount = completedToday.length;
  const avgWait = myDoctor?.averageConsultationTime || 12;

  return (
    <RoleGuard roles={['DOCTOR', 'ADMIN', 'SUPER_ADMIN']}>
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        
        {/* Doctor Header Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">{myDoctor?.name} Dashboard</h1>
            <p className="text-xs text-text-secondary mt-1 font-semibold">
              Consulting: <span className="text-primary">{myDoctor?.roomNumber}</span> • Specialization: {myDoctor?.specialization}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Queue controls:</span>
            {isPaused ? (
              <Button
                onClick={handleResume}
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm"
                isLoading={actionLoading}
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Resume Queue
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                variant="primary"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white border-0 shadow-sm"
                isLoading={actionLoading}
              >
                <Pause className="w-3.5 h-3.5 fill-white" /> Pause Queue
              </Button>
            )}

            <Button
              onClick={handleAddDelay}
              variant="outline"
              size="sm"
              isLoading={actionLoading}
            >
              <Clock className="w-3.5 h-3.5 text-primary" /> Add +10m Delay
            </Button>

            <Button
              onClick={async () => {
                setActionLoading(true);
                try {
                  await callPrevious(myDoctor.id);
                } catch {
                  alert('Failed to call previous patient.');
                } finally {
                  setActionLoading(false);
                }
              }}
              variant="outline"
              size="sm"
              isLoading={actionLoading}
            >
              Recall Previous
            </Button>
          </div>
        </div>

        {/* Pending Emergency Alert banner */}
        {pendingEmergencies.map((emg) => (
          <div key={emg.id} className="p-4 rounded-xl bg-danger-muted border border-danger/25 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-bounce">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-5 h-5 text-danger shrink-0 animate-pulse" />
              <div>
                <span className="text-[9px] font-black text-danger uppercase tracking-wider bg-danger-muted px-2 py-0.5 rounded mr-2 border border-danger/10">
                  Emergency Priority Approval
                </span>
                <span className="text-xs font-bold text-text-primary leading-tight block sm:inline mt-1 sm:mt-0">
                  Patient {emg.patientName} (Token: {emg.tokenNumber}) flagged as EMERGENCY check-in.
                </span>
              </div>
            </div>
            <Button
              onClick={() => approveEmergency(emg.id)}
              variant="primary"
              size="sm"
              className="bg-danger hover:bg-red-600 hover:shadow-lg hover:shadow-danger/10 border-0"
            >
              <Check className="w-3.5 h-3.5" /> Approve & Move Next
            </Button>
          </div>
        ))}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Active Consultation Panel */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {activeToken ? (
              <Card className="flex flex-col gap-6 border-primary/20 bg-bg-surface">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-subtle/50 pb-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="primary">Now Serving</Badge>
                    <span className="text-3xl font-black text-text-primary">{activeToken.tokenNumber}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSkip}
                      variant="outline"
                      size="sm"
                      isLoading={actionLoading}
                    >
                      <SkipForward className="w-3.5 h-3.5 text-text-muted" /> Skip
                    </Button>
                    <Button
                      onClick={handleRecall}
                      variant="outline"
                      size="sm"
                      isLoading={actionLoading}
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-text-muted" /> Recall
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-xl border border-border-subtle bg-bg-muted/10">
                    <span className="text-[10px] text-text-muted font-bold uppercase">Patient Name</span>
                    <div className="text-xs font-bold text-text-primary mt-1">{activeToken.patientName}</div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border-subtle bg-bg-muted/10">
                    <span className="text-[10px] text-text-muted font-bold uppercase">Demographics</span>
                    <div className="text-xs font-bold text-text-primary mt-1">
                      {activeToken.patientAge} yrs • {activeToken.patientGender}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border-subtle bg-bg-muted/10 truncate">
                    <span className="text-[10px] text-text-muted font-bold uppercase">Reason for Visit</span>
                    <div className="text-xs font-bold text-text-primary mt-1 truncate" title={activeToken.reason}>
                      {activeToken.reason}
                    </div>
                  </div>
                </div>

                {/* Consultation Records / Form */}
                <form onSubmit={handleComplete} className="flex flex-col gap-4">
                  <Input
                    label="Diagnosis / Medical Condition"
                    required
                    placeholder="e.g. Mild hypertension, seasonal allergic rhinitis..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    error={consultErrors.diagnosis || undefined}
                  />

                  <Input
                    label="Prescribed Medicines (comma-separated)"
                    placeholder="e.g. Amoxicillin 500mg, Cetirizine 10mg..."
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                  />

                  <Textarea
                    label="Consultation Notes & Advising"
                    rows={4}
                    placeholder="Enter follow-up schedules, therapeutic advice, dietary restrictions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full mt-2"
                    isLoading={actionLoading}
                  >
                    Complete Consultation & Call Next
                  </Button>
                </form>
              </Card>
            ) : (
              <Card className="border-dashed border-border-subtle p-8 text-center flex flex-col items-center justify-center bg-bg-surface/50">
                <div className="w-16 h-16 rounded-full bg-primary-glow border border-primary/20 text-primary flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-base font-black text-text-primary">Ready to Consult</h3>
                <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto mb-6">
                  There are currently no patients active in your room. Click the button below to fetch the next ticket in queue.
                </p>
                <Button
                  onClick={handleCallNext}
                  disabled={upcomingQueue.length === 0}
                  variant="primary"
                  isLoading={actionLoading}
                >
                  Call Next Patient
                </Button>
              </Card>
            )}

            {/* Patient medical reports and historical logs */}
            {activeToken && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Patient Reports Folder */}
                <Card className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5 border-b border-border-subtle/50 pb-3">
                    <FileText className="w-4 h-4 text-primary" /> Patient Medical Folders
                  </h3>
                  
                  {reports.filter(r => r.patientId === activeToken.patientId).length === 0 ? (
                    <span className="text-xs text-text-muted py-4 text-center">No reports uploaded.</span>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {reports.filter(r => r.patientId === activeToken.patientId).map((rep) => (
                        <div key={rep.id} className="p-3 rounded-xl border border-border-subtle bg-bg-muted/10 flex items-center justify-between gap-3">
                          <div className="truncate pr-2">
                            <div className="text-xs font-bold text-text-primary truncate">{rep.fileName}</div>
                            <div className="text-[9px] text-text-muted font-bold uppercase tracking-wider mt-0.5">{rep.reportType}</div>
                          </div>
                          <Button
                            onClick={() => setPreviewReport(rep)}
                            variant="outline"
                            size="sm"
                            className="p-1 px-2 text-[10px]"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Consultation History */}
                <Card className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5 border-b border-border-subtle/50 pb-3">
                    <History className="w-4 h-4 text-primary" /> Consultation History
                  </h3>
                  
                  {visits.filter(v => v.patientId === activeToken.patientId).length === 0 ? (
                    <span className="text-xs text-text-muted py-4 text-center">No previous visits recorded.</span>
                  ) : (
                    <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                      {visits.filter(v => v.patientId === activeToken.patientId).map((vis) => (
                        <div key={vis.id} className="p-3 rounded-xl border border-border-subtle bg-bg-muted/10 text-xs flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold text-text-muted">
                            <span>{vis.date}</span>
                            <span>{vis.doctorName}</span>
                          </div>
                          <div className="font-extrabold text-text-primary">Diagnosis: {vis.diagnosis}</div>
                          <div className="text-[11px] text-text-secondary leading-relaxed">Notes: {vis.notes}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

              </div>
            )}

          </div>

          {/* Column 3: Upcoming Queue List & Stats */}
          <div className="flex flex-col gap-6">
            
            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="text-center p-4">
                <span className="text-[10px] text-text-muted font-bold uppercase">Treated Today</span>
                <div className="text-3xl font-black text-text-primary mt-1">{completedCount}</div>
              </Card>
              <Card className="text-center p-4">
                <span className="text-[10px] text-text-muted font-bold uppercase">Avg. Wait</span>
                <div className="text-3xl font-black text-text-primary mt-1">{avgWait}m</div>
              </Card>
            </div>

            {/* Upcoming Patient queue cards */}
            <Card className="flex flex-col gap-4">
              <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle/50 pb-3">
                Upcoming Patients Queue ({upcomingQueue.length})
              </h2>

              {upcomingQueue.length === 0 ? (
                <span className="text-xs text-text-muted py-4 text-center">Waiting room is empty.</span>
              ) : (
                <div className="flex flex-col gap-3">
                  {upcomingQueue.map((tok, index) => (
                    <div 
                      key={tok.id} 
                      className="p-3 rounded-xl border border-border-subtle bg-bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-primary/20 transition"
                    >
                      <div className="truncate w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="primary" size="sm">
                            {tok.tokenNumber}
                          </Badge>
                          <span className="text-xs font-bold text-text-primary truncate">{tok.patientName}</span>
                        </div>
                        <div className="text-[9px] text-text-muted font-bold uppercase tracking-wider mt-1 truncate">
                          Est. Wait: {tok.estimatedWait}m • {tok.reason}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Transfer Doctor (operations role only — backend enforces) */}
                        {canManageOps && (
                        <>
                        <select
                          value={tok.doctorId}
                          onChange={(e) => transferPatient(tok.id, e.target.value)}
                          className="text-xs bg-bg-surface border border-border-subtle rounded px-1.5 py-1 text-text-secondary focus:outline-none w-24 max-w-[90px]"
                          title="Transfer Doctor"
                        >
                          {doctors
                            .filter(d => d.clinicId === myDoctor.clinicId)
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
                          className="p-1 rounded text-text-secondary hover:text-danger hover:bg-danger-muted/30"
                          title="Cancel Token"
                        >
                          ✕
                        </button>
                        </>
                        )}

                        {index === 0 && (
                          <Button
                            onClick={handleCallNext}
                            variant="primary"
                            size="sm"
                            className="px-3 py-1.5 text-xs"
                            isLoading={actionLoading}
                          >
                            Call
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* AI Assistant Wait Predictor tip */}
            <div className="p-5 rounded-2xl bg-gradient-to-tr from-primary to-indigo-700 text-white shadow relative overflow-hidden flex flex-col gap-3">
              <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 w-16 h-16 bg-white/10 blur-md pointer-events-none rounded-full" />
              <div className="flex items-center gap-2">
                <span className="text-base">🤖</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-100">AI consultation Speed</span>
              </div>
              <div className="text-xs font-semibold">Dr. {myDoctor?.name.split(' ').pop()} consultation speed:</div>
              <div className="text-3xl font-black tracking-tight">1.2x Faster Today</div>
              <p className="text-[10px] text-indigo-100 leading-relaxed font-medium">
                Our model adjusted next 5 patient wait estimates down by -4 mins due to accelerated consult cycles.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Floating Medical Document Preview Overlay (Lightbox dialog popup) */}
      <Dialog
        isOpen={previewReport !== null}
        onClose={() => setPreviewReport(null)}
        title={previewReport?.fileName || 'Medical File'}
        description={previewReport?.reportType}
        footer={
          <Button onClick={() => setPreviewReport(null)} variant="primary">
            Done Reviewing
          </Button>
        }
      >
        <div className="p-6 h-[320px] bg-bg-muted/20 border border-border-subtle/50 rounded-xl flex flex-col items-center justify-center text-center gap-3">
          {previewReport?.fileType === 'pdf' ? (
            <>
              <FileText className="w-16 h-16 text-primary animate-pulse" />
              <div className="text-xs font-bold text-text-primary">Simulated Complete Blood Count & Lipid Panel</div>
              <div className="text-[11px] text-text-secondary leading-relaxed max-w-sm">
                Cholesterol: 180 mg/dL (Normal) • HbA1c: 5.4% (Normal) • RBC: 4.8 million/uL. Everything is within reference range.
              </div>
            </>
          ) : (
            <>
              <span className="text-6xl select-none animate-pulse">🩻</span>
              <div className="text-xs font-bold text-text-primary">Simulated Chest X-Ray Scan Image</div>
              <div className="text-[11px] text-text-secondary leading-relaxed max-w-sm">
                Visual examination displays normal cardiac contours and clean clear lungs. No signs of infection.
              </div>
            </>
          )}
        </div>
      </Dialog>

    </DashboardLayout>
    </RoleGuard>
  );
}
