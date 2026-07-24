'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Clinic,
  Doctor,
  Patient,
  Appointment,
  QueueToken,
  Visit,
  MedicalReport,
  Notification,
  MOCK_CLINICS,
  MOCK_DOCTORS,
  INITIAL_PATIENTS,
  MOCK_NOTIFICATIONS,
  AI_PREDICTIONS,
} from '../lib/mockData';
import { supabase } from '../lib/supabaseClient';
import confetti from 'canvas-confetti';

interface AppContextType {
  clinics: Clinic[];
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  queueTokens: QueueToken[];
  visits: Visit[];
  reports: MedicalReport[];
  notifications: Notification[];
  
  currentClinic: Clinic;
  setClinicById: (id: string) => void;
  currentRole: 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN';
  setCurrentRole: (role: 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN') => void;
  currentUser: { id: string; name: string; email: string; avatar?: string } | null;
  setCurrentUserById: (id: string) => void;
  
  // Patient actions
  bookAppointment: (doctorId: string, reason: string, dateTime: string) => Promise<Appointment>;
  checkInAppointment: (appointmentId: string) => Promise<QueueToken>;
  uploadReport: (fileName: string, reportType: string, fileType: 'pdf' | 'image') => Promise<void>;
  
  // Receptionist actions
  registerWalkIn: (name: string, age: number, gender: string, phone: string, doctorId: string, reason: string) => Promise<QueueToken>;
  reorderQueue: (tokenId: string, direction: 'up' | 'down') => Promise<void>;
  toggleEmergency: (tokenId: string, status: boolean) => Promise<void>;
  approveEmergency: (tokenId: string) => Promise<void>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  markNoShow: (tokenId: string) => Promise<void>;
  
  // Doctor actions
  callNext: (doctorId: string) => Promise<QueueToken | null>;
  skipPatient: (tokenId: string) => Promise<void>;
  recallPatient: (tokenId: string) => Promise<void>;
  completeConsultation: (tokenId: string, diagnosis: string, prescription: string, notes: string) => Promise<void>;
  pauseQueue: (doctorId: string) => Promise<void>;
  resumeQueue: (doctorId: string) => Promise<void>;
  addDelay: (doctorId: string, mins: number) => Promise<void>;

  // Global actions
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  aiPredictions: typeof AI_PREDICTIONS;
  triggerVoiceAnnouncement: (text: string) => void;
  fetchQueueData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Database States loaded from APIs
  const [clinics, setClinics] = useState<Clinic[]>(MOCK_CLINICS);
  const [doctors, setDoctors] = useState<Doctor[]>(MOCK_DOCTORS);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queueTokens, setQueueTokens] = useState<QueueToken[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  // App Level configurations
  const [currentClinic, setCurrentClinic] = useState<Clinic>(MOCK_CLINICS[0]);
  const [currentRole, setCurrentRole] = useState<'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN'>('PATIENT');
  const [currentUser, setCurrentUser] = useState<any>({
    id: 'pat-1',
    name: 'Alex Harrison',
    email: 'alex.harrison@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // --- CORE REFETCH UTILITIES ---

  const fetchQueueData = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue?clinicId=${currentClinic.id}`);
      if (res.ok) {
        const data = await res.json();
        setQueueTokens(data);
      }
    } catch (e) {
      console.error('Error fetching live queue data:', e);
    }
  }, [currentClinic.id]);

  const fetchUserData = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      // 1. Fetch appointments
      const apptRes = await fetch(`/api/appointments?role=${currentRole}&userId=${currentUser.id}&clinicId=${currentClinic.id}`);
      if (apptRes.ok) {
        const appts = await apptRes.json();
        setAppointments(appts);
      }

      // 2. Fetch reports (if patient)
      if (currentRole === 'PATIENT') {
        const repRes = await fetch(`/api/reports?userId=${currentUser.id}`);
        if (repRes.ok) {
          const reps = await repRes.json();
          setReports(reps);
        }

        const visRes = await fetch(`/api/visits?userId=${currentUser.id}`);
        if (visRes.ok) {
          const viss = await visRes.json();
          setVisits(viss);
        }
      }
    } catch (e) {
      console.error('Error fetching user relative data:', e);
    }
  }, [currentUser?.id, currentRole, currentClinic.id]);

  // Load initial clinic setup and doctors list
  useEffect(() => {
    // If databases are not seeded, sync syncs them on startup
    const runProfileSync = async () => {
      try {
        await fetch(`/api/auth/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser?.id || 'pat-1', name: currentUser?.name, email: currentUser?.email, role: currentRole }),
        });
        fetchQueueData();
      } catch (err) {
        console.error('Init sync error:', err);
      }
    };
    runProfileSync();
  }, [currentUser?.id, currentClinic.id, currentRole, fetchQueueData]);

  // Refetch when user context changes
  useEffect(() => {
    fetchUserData();
  }, [currentUser?.id, currentRole, currentClinic.id, fetchUserData]);

  // Real-time Database subscription to QueueToken table via Supabase channels
  useEffect(() => {
    const queueChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'QueueToken',
        },
        (payload: any) => {
          console.log('Realtime QueueToken table updated:', payload);
          fetchQueueData();

          // Check if a patient was called, to trigger Text-To-Speech announcement locally
          if (payload.eventType === 'UPDATE' && payload.new.status === 'CALLED' && payload.old.status !== 'CALLED') {
            const tk = payload.new;
            const doc = MOCK_DOCTORS.find(d => d.id === tk.doctorId);
            const text = `Ticket number ${tk.tokenNumber}, please proceed to ${doc?.roomNumber || 'Room 101'}.`;
            triggerVoiceAnnouncement(text);

            addNotification(
              'It is Your Turn!',
              `Ticket ${tk.tokenNumber}: Please proceed to ${doc?.roomNumber || 'Room 101'} with ${doc?.name || 'Physician'}.`,
              'PUSH'
            );
          }
        }
      )
      .subscribe();

    // Dark/Light configuration
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    return () => {
      supabase.removeChannel(queueChannel);
    };
  }, [theme, fetchQueueData]);

  // Clinic Tenant Selector
  const setClinicById = (id: string) => {
    const target = clinics.find(c => c.id === id);
    if (target) {
      setCurrentClinic(target);
      if (currentRole === 'DOCTOR') {
        const docInClinic = doctors.find(d => d.clinicId === id);
        if (docInClinic) setCurrentUserById(docInClinic.id);
      }
    }
  };

  // Role Simulator login bypass
  const setCurrentUserById = (id: string) => {
    if (id.startsWith('pat-')) {
      const p = patients.find(pat => pat.id === id);
      if (p) {
        setCurrentUser({ id: p.id, name: p.name, email: p.email || '', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300' });
      }
    } else if (id.startsWith('doc-')) {
      const d = doctors.find(doc => doc.id === id);
      if (d) {
        setCurrentUser({ id: d.id, name: d.name, email: d.email, avatar: d.avatar });
      }
    } else if (id === 'receptionist') {
      setCurrentUser({ id: 'receptionist-id', name: 'Jane Miller', email: 'jane.m@clinic.com' });
    } else if (id === 'admin') {
      setCurrentUser({ id: 'admin-id', name: 'Dr. Gregory House', email: 'director@clinic.com' });
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const triggerVoiceAnnouncement = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      console.log('Speech announcement:', text);
    }
  };

  const addNotification = (title: string, body: string, channel: 'PUSH' | 'SMS' | 'WHATSAPP' | 'EMAIL' = 'PUSH') => {
    const newNotif: Notification = {
      id: `not-${Date.now()}`,
      title,
      body,
      time: 'Just now',
      isRead: false,
      channel,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // --- ACTIONS WITH BACKEND API ROUTE HANDLERS ---

  // Patient: Book appointment
  const bookAppointment = async (doctorId: string, reason: string, dateTime: string) => {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser?.id,
        doctorId,
        dateTime,
        reason,
        clinicId: currentClinic.id,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to book appointment');
    }

    const appt = await res.json();
    fetchUserData(); // reload
    return appt;
  };

  // Patient / Receptionist: Check-in appointment
  const checkInAppointment = async (appointmentId: string) => {
    const res = await fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId,
        clinicId: currentClinic.id,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to check in');
    }

    const token = await res.json();
    fetchQueueData();
    fetchUserData();

    // Celebration
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: [currentClinic.primaryColor, '#10b981', '#34d399'],
    });

    return token;
  };

  // Patient: upload report
  const uploadReport = async (fileName: string, reportType: string, fileType: 'pdf' | 'image') => {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser?.id,
        fileName,
        fileType,
        reportType,
      }),
    });

    if (res.ok) {
      fetchUserData();
      addNotification('Report Uploaded', `Your report ${fileName} was shared with your doctor.`, 'PUSH');
    }
  };

  // Receptionist: register walk-in patient
  const registerWalkIn = async (name: string, age: number, gender: string, phone: string, doctorId: string, reason: string) => {
    const res = await fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        age,
        gender,
        phone,
        doctorId,
        reason,
        clinicId: currentClinic.id,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register walk-in');
    }

    const token = await res.json();
    fetchQueueData();
    return token;
  };

  // Receptionist: Reorder Queue
  const reorderQueue = async (tokenId: string, direction: 'up' | 'down') => {
    const res = await fetch('/api/queue/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reorder',
        tokenId,
        direction,
      }),
    });

    if (res.ok) {
      fetchQueueData();
      addNotification('Queue Reordered', 'The patient position was updated in queue.', 'PUSH');
    }
  };

  // Receptionist: toggle emergency status
  const toggleEmergency = async (tokenId: string, status: boolean) => {
    const res = await fetch('/api/queue/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'toggle-emergency',
        tokenId,
        isEmergency: status,
      }),
    });

    if (res.ok) {
      fetchQueueData();
      if (status) {
        addNotification('Emergency Alert', 'EMERGENCY declared. Doctor approval requested.', 'PUSH');
      }
    }
  };

  // Doctor: Approve emergency priority
  const approveEmergency = async (tokenId: string) => {
    const res = await fetch('/api/queue/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'approve-emergency',
        tokenId,
      }),
    });

    if (res.ok) {
      fetchQueueData();
      addNotification('Emergency Approved', 'Emergency patient moved next in line.', 'PUSH');
    }
  };

  // Receptionist: Cancel appointment
  const cancelAppointment = async (appointmentId: string) => {
    const res = await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId,
        status: 'CANCELLED',
      }),
    });

    if (res.ok) {
      fetchUserData();
      addNotification('Appointment Cancelled', 'Booking was marked cancelled.', 'EMAIL');
    }
  };

  // Receptionist: Mark No-Show
  const markNoShow = async (tokenId: string) => {
    const res = await fetch('/api/queue/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'skip',
        tokenId,
      }),
    });

    if (res.ok) {
      fetchQueueData();
      addNotification('Patient marked No-Show', 'Token status set to skipped.', 'PUSH');
    }
  };

  // Doctor: Call Next
  const callNext = async (doctorId: string) => {
    const res = await fetch('/api/queue/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'call-next',
        doctorId,
      }),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    fetchQueueData();
    return data.calledToken;
  };

  // Doctor: Skip Patient
  const skipPatient = async (tokenId: string) => {
    const res = await fetch('/api/queue/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'skip',
        tokenId,
      }),
    });

    if (res.ok) {
      fetchQueueData();
    }
  };

  // Doctor: Recall Patient
  const recallPatient = async (tokenId: string) => {
    const res = await fetch('/api/queue/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'recall',
        tokenId,
      }),
    });

    if (res.ok) {
      fetchQueueData();
    }
  };

  // Doctor: Complete Consultation
  const completeConsultation = async (tokenId: string, diagnosis: string, prescription: string, notes: string) => {
    const res = await fetch('/api/queue/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete',
        tokenId,
        diagnosis,
        prescription,
        notes,
      }),
    });

    if (res.ok) {
      fetchQueueData();
      fetchUserData();
      addNotification('Consultation Completed', 'Medical records and prescriptions updated.', 'EMAIL');
    }
  };

  // Doctor: Pause Queue
  const pauseQueue = async (doctorId: string) => {
    const res = await fetch('/api/queue/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'pause-queue',
        doctorId,
      }),
    });

    if (res.ok) {
      setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, isActive: 'false' } : d));
      addNotification('Queue Paused', 'Consulting queue set to paused.', 'PUSH');
    }
  };

  // Doctor: Resume Queue
  const resumeQueue = async (doctorId: string) => {
    const res = await fetch('/api/queue/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'resume-queue',
        doctorId,
      }),
    });

    if (res.ok) {
      setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, isActive: 'true' } : d));
      addNotification('Queue Resumed', 'Consulting queue is now active.', 'PUSH');
    }
  };

  // Doctor: Add delay
  const addDelay = async (doctorId: string, mins: number) => {
    const res = await fetch('/api/queue/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add-delay',
        doctorId,
        mins: mins.toString(),
      }),
    });

    if (res.ok) {
      fetchQueueData();
      addNotification('Doctor Running Late', `Estimated wait times adjusted +${mins}m.`, 'SMS');
    }
  };

  return (
    <AppContext.Provider value={{
      clinics,
      doctors,
      patients,
      appointments,
      queueTokens,
      visits,
      reports,
      notifications,
      currentClinic,
      setClinicById,
      currentRole,
      setCurrentRole,
      currentUser,
      setCurrentUserById,
      bookAppointment,
      checkInAppointment,
      uploadReport,
      registerWalkIn,
      reorderQueue,
      toggleEmergency,
      approveEmergency,
      cancelAppointment,
      markNoShow,
      callNext,
      skipPatient,
      recallPatient,
      completeConsultation,
      pauseQueue,
      resumeQueue,
      addDelay,
      theme,
      toggleTheme,
      aiPredictions: AI_PREDICTIONS,
      triggerVoiceAnnouncement,
      fetchQueueData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
