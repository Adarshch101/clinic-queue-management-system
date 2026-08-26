'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '@/context/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGuard } from '@/components/guards/RoleGuard';
import type { QueueToken } from '@/lib/mockData';
import {
  validateName,
  validateAge,
  validatePhone,
  validateRequired,
  hasErrors,
  type ValidationErrors,
} from '@/lib/validation';

const WalkInRegisterTab = dynamic(
  () => import('@/components/dashboard/receptionist/tabs/WalkInRegisterTab').then((m) => m.WalkInRegisterTab),
  {
    loading: () => (
      <div className="h-64 rounded-2xl bg-bg-muted animate-pulse flex items-center justify-center text-xs font-bold text-text-muted">
        Loading Registration Console...
      </div>
    ),
    ssr: false,
  }
);

const AppointmentsCheckInTab = dynamic(
  () => import('@/components/dashboard/receptionist/tabs/AppointmentsCheckInTab').then((m) => m.AppointmentsCheckInTab),
  {
    loading: () => (
      <div className="h-64 rounded-2xl bg-bg-muted animate-pulse flex items-center justify-center text-xs font-bold text-text-muted">
        Loading Appointment Check-In...
      </div>
    ),
    ssr: false,
  }
);

const LiveQueueControlTab = dynamic(
  () => import('@/components/dashboard/receptionist/tabs/LiveQueueControlTab').then((m) => m.LiveQueueControlTab),
  {
    loading: () => (
      <div className="h-64 rounded-2xl bg-bg-muted animate-pulse flex items-center justify-center text-xs font-bold text-text-muted">
        Loading Lobby Queue Monitor...
      </div>
    ),
    ssr: false,
  }
);

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
    cancelPatientToken,
  } = useApp();

  // Active tab state driven by URL hash (#register, #bookings, #waitlist)
  const [activeTab, setActiveTab] = useState('register');

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['register', 'bookings', 'waitlist'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

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

  const [walkInErrors, setWalkInErrors] = useState<ValidationErrors>({});

  const handleWalkInSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errors: ValidationErrors = {
        name: validateName(walkInName, 'Patient name'),
        age: validateAge(walkInAge),
        phone: validatePhone(walkInPhone),
        doctorId: validateRequired(walkInDocId, 'Physician'),
        reason: validateRequired(walkInReason, 'Reason for visit'),
      };
      if (hasErrors(errors)) {
        setWalkInErrors(errors);
        return;
      }
      setWalkInErrors({});

      setRegisterLoading(true);
      try {
        const token = await registerWalkIn(
          walkInName,
          parseInt(walkInAge, 10),
          walkInGender,
          walkInPhone,
          walkInDocId,
          walkInReason
        );

        setPrintedSlip(token);
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
    },
    [walkInName, walkInAge, walkInGender, walkInPhone, walkInDocId, walkInReason, registerWalkIn]
  );

  const handlePrint = useCallback((token: QueueToken) => {
    setPrintedSlip(token);
  }, []);

  // Memoized appointment search filter
  const filteredAppointments = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return appointments.filter((a) => a.status === 'SCHEDULED');
    }
    return appointments.filter(
      (appt) =>
        appt.status === 'SCHEDULED' &&
        (appt.patientName.toLowerCase().includes(query) ||
          appt.doctorName.toLowerCase().includes(query) ||
          appt.reason.toLowerCase().includes(query))
    );
  }, [appointments, searchQuery]);

  // Memoized active queue tokens
  const activeQueues = useMemo(() => {
    return queueTokens.filter((tok) => {
      const isDoctorMatch = selectedDoctorId === 'all' || tok.doctorId === selectedDoctorId;
      return isDoctorMatch && ['WAITING', 'CALLED', 'IN_CONSULTATION'].includes(tok.status);
    });
  }, [queueTokens, selectedDoctorId]);

  return (
    <RoleGuard roles={['RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN']}>
      <DashboardLayout>
        <div className="flex flex-col gap-8">
          {/* Header Title Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-text-primary">
                Reception Control Panel
              </h1>
              <p className="text-xs text-text-secondary mt-1 font-medium">
                Manage appointments check-in, register walk-ins, and orchestrate live doctor queues.
              </p>
            </div>
          </div>

          {/* TAB CONTENT AREA */}
          {activeTab === 'register' && (
            <WalkInRegisterTab
              walkInName={walkInName}
              setWalkInName={setWalkInName}
              walkInAge={walkInAge}
              setWalkInAge={setWalkInAge}
              walkInGender={walkInGender}
              setWalkInGender={setWalkInGender}
              walkInPhone={walkInPhone}
              setWalkInPhone={setWalkInPhone}
              walkInDocId={walkInDocId}
              setWalkInDocId={setWalkInDocId}
              walkInReason={walkInReason}
              setWalkInReason={setWalkInReason}
              walkInErrors={walkInErrors}
              registerLoading={registerLoading}
              handleWalkInSubmit={handleWalkInSubmit}
              printedSlip={printedSlip}
              setPrintedSlip={setPrintedSlip}
              doctors={doctors}
              currentClinic={currentClinic}
            />
          )}

          {activeTab === 'bookings' && (
            <AppointmentsCheckInTab
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredAppointments={filteredAppointments}
              checkInAppointment={checkInAppointment}
              cancelAppointment={cancelAppointment}
              markNoShow={markNoShow}
            />
          )}

          {activeTab === 'waitlist' && (
            <LiveQueueControlTab
              activeQueues={activeQueues}
              doctors={doctors}
              selectedDoctorId={selectedDoctorId}
              setSelectedDoctorId={setSelectedDoctorId}
              reorderQueue={reorderQueue}
              toggleEmergency={toggleEmergency}
              transferPatient={transferPatient}
              cancelPatientToken={cancelPatientToken}
              handlePrint={handlePrint}
            />
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
