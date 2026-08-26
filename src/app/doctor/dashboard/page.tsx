'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '@/context/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGuard } from '@/components/guards/RoleGuard';
import type { Doctor, MedicalReport } from '@/lib/mockData';
import { validateRequired, hasErrors, type ValidationErrors } from '@/lib/validation';

const DoctorConsultationTab = dynamic(
  () => import('@/components/dashboard/doctor/tabs/DoctorConsultationTab').then((m) => m.DoctorConsultationTab),
  {
    loading: () => (
      <div className="h-64 rounded-2xl bg-bg-muted animate-pulse flex items-center justify-center text-xs font-bold text-text-muted">
        Loading Consultation Room...
      </div>
    ),
    ssr: false,
  }
);

const DoctorQueueTab = dynamic(
  () => import('@/components/dashboard/doctor/tabs/DoctorQueueTab').then((m) => m.DoctorQueueTab),
  {
    loading: () => (
      <div className="h-64 rounded-2xl bg-bg-muted animate-pulse flex items-center justify-center text-xs font-bold text-text-muted">
        Loading Room Queue...
      </div>
    ),
    ssr: false,
  }
);

const DoctorHistoryTab = dynamic(
  () => import('@/components/dashboard/doctor/tabs/DoctorHistoryTab').then((m) => m.DoctorHistoryTab),
  {
    loading: () => (
      <div className="h-64 rounded-2xl bg-bg-muted animate-pulse flex items-center justify-center text-xs font-bold text-text-muted">
        Loading Consultation History...
      </div>
    ),
    ssr: false,
  }
);

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
    fetchPatientRecords,
  } = useApp();

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

  const [previewReport, setPreviewReport] = useState<MedicalReport | null>(null);
  
  const [actionLoading, setActionLoading] = useState(false);

  // Active tab state driven by URL hash
  const [activeTab, setActiveTab] = useState('consultation');

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['consultation', 'queue', 'history'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  // Memoized queue data
  const upcomingQueue = useMemo(
    () =>
      queueTokens
        .filter((t) => t.doctorId === myDoctor?.id && t.status === 'WAITING')
        .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id)),
    [queueTokens, myDoctor?.id]
  );

  const completedToday = useMemo(
    () => queueTokens.filter((t) => t.doctorId === myDoctor?.id && t.status === 'COMPLETED'),
    [queueTokens, myDoctor?.id]
  );

  const pendingEmergencies = useMemo(
    () =>
      queueTokens.filter(
        (t) => t.doctorId === myDoctor?.id && t.isEmergency && t.status === 'WAITING' && t.priority < 1000
      ),
    [queueTokens, myDoctor?.id]
  );

  const activeToken = useMemo(
    () =>
      queueTokens.find(
        (t) => t.doctorId === myDoctor?.id && ['CALLED', 'IN_CONSULTATION'].includes(t.status)
      ),
    [queueTokens, myDoctor?.id]
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

  // Stable handlers using useCallback
  const handleCallNextCallback = useCallback(async () => {
    if (!myDoctor) return;
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
  }, [myDoctor, callNext]);

  const handleCompleteCallback = useCallback(
    async (e: React.FormEvent) => {
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
        await completeConsultation(activeToken.id, diagnosis.trim(), prescription, notes);
        setDiagnosis('');
        setPrescription('');
        setNotes('');
      } catch {
        alert('Failed to complete consultation.');
      } finally {
        setActionLoading(false);
      }
    },
    [activeToken, diagnosis, prescription, notes, completeConsultation]
  );

  const handleSkipCallback = useCallback(async () => {
    if (!activeToken) return;
    setActionLoading(true);
    try {
      await skipPatient(activeToken.id);
    } catch {
      alert('Failed to skip patient.');
    } finally {
      setActionLoading(false);
    }
  }, [activeToken, skipPatient]);

  const handleRecallCallback = useCallback(async () => {
    if (!activeToken) return;
    setActionLoading(true);
    try {
      await recallPatient(activeToken.id);
    } catch {
      alert('Failed to recall patient.');
    } finally {
      setActionLoading(false);
    }
  }, [activeToken, recallPatient]);

  const handlePauseCallback = useCallback(async () => {
    if (!myDoctor) return;
    setActionLoading(true);
    try {
      await pauseQueue(myDoctor.id);
    } catch {
      alert('Failed to pause queue.');
    } finally {
      setActionLoading(false);
    }
  }, [myDoctor, pauseQueue]);

  const handleResumeCallback = useCallback(async () => {
    if (!myDoctor) return;
    setActionLoading(true);
    try {
      await resumeQueue(myDoctor.id);
    } catch {
      alert('Failed to resume queue.');
    } finally {
      setActionLoading(false);
    }
  }, [myDoctor, resumeQueue]);

  const handleAddDelayCallback = useCallback(async () => {
    if (!myDoctor) return;
    setActionLoading(true);
    try {
      await addDelay(myDoctor.id, 10);
    } catch {
      alert('Failed to add delay.');
    } finally {
      setActionLoading(false);
    }
  }, [myDoctor, addDelay]);

  const handleApproveEmergencyCallback = useCallback(
    async (tokenId: string) => {
      setActionLoading(true);
      try {
        await approveEmergency(tokenId);
      } catch {
        alert('Failed to approve emergency request.');
      } finally {
        setActionLoading(false);
      }
    },
    [approveEmergency]
  );

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

  return (
    <RoleGuard roles={['DOCTOR', 'ADMIN', 'SUPER_ADMIN']}>
      <DashboardLayout>
        <div className="flex flex-col gap-8">
          {/* Doctor Header Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-text-primary">
                {myDoctor.name} Suite
              </h1>
              <p className="text-xs text-text-secondary mt-1 font-semibold">
                Consulting Room: <span className="text-primary">Room {myDoctor.roomNumber || '101'}</span> • Specialization: {myDoctor.specialization}
              </p>
            </div>

          </div>

          {/* TAB CONTENT AREA */}
          {activeTab === 'consultation' && (
            <DoctorConsultationTab
              activeToken={activeToken}
              myDoctor={myDoctor}
              diagnosis={diagnosis}
              setDiagnosis={setDiagnosis}
              prescription={prescription}
              setPrescription={setPrescription}
              notes={notes}
              setNotes={setNotes}
              consultErrors={consultErrors}
              actionLoading={actionLoading}
              isPaused={isPaused}
              visits={visits}
              reports={reports}
              previewReport={previewReport}
              setPreviewReport={setPreviewReport}
              handleCallNext={handleCallNextCallback}
              handleComplete={handleCompleteCallback}
              handleSkip={handleSkipCallback}
              handleRecall={handleRecallCallback}
              handlePause={handlePauseCallback}
              handleResume={handleResumeCallback}
              handleAddDelay={handleAddDelayCallback}
            />
          )}

          {activeTab === 'queue' && (
            <DoctorQueueTab
              upcomingQueue={upcomingQueue}
              pendingEmergencies={pendingEmergencies}
              approveEmergency={handleApproveEmergencyCallback}
              actionLoading={actionLoading}
            />
          )}

          {activeTab === 'history' && (
            <DoctorHistoryTab completedToday={completedToday} />
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
