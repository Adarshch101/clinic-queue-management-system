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
} from '../lib/mockData';
import { supabase } from '../lib/supabaseClient';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import { useAuth } from '@/features/auth/context/AuthContext';

interface CurrentUserInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface ClinicSearchDto {
  id: string;
  name: string;
  subdomain: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  doctors?: DoctorSearchDto[];
}

interface DoctorSearchDto {
  id: string;
  name: string;
  specialization?: string | null;
  roomNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  averageConsultationTime?: number | null;
  isActive?: string | boolean;
}

interface AppContextType {
  clinics: Clinic[];
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  queueTokens: QueueToken[];
  visits: Visit[];
  reports: MedicalReport[];
  notifications: Notification[];
  
  currentClinic: Clinic | null;
  setClinicById: (id: string) => void;
  currentRole: 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN';
  setCurrentRole: (role: 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN') => void;
  currentUser: CurrentUserInfo | null;
  
  // Patient actions
  bookAppointment: (doctorId: string, reason: string, dateTime: string) => Promise<Appointment>;
  checkInAppointment: (appointmentId: string) => Promise<QueueToken>;
  uploadReport: (file: File, reportType: string, fileType: 'pdf' | 'image') => Promise<void>;
  
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
  callPrevious: (doctorId: string) => Promise<void>;
  transferPatient: (tokenId: string, targetDoctorId: string) => Promise<void>;
  cancelPatientToken: (tokenId: string) => Promise<void>;

  // Global actions
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  triggerVoiceAnnouncement: (text: string) => void;
  fetchQueueData: () => Promise<void>;
  fetchPatientRecords: (patientId: string) => Promise<void>;
  markNotifAsRead: (notificationId: string) => Promise<void>;
  markAllNotifsAsRead: () => Promise<void>;
  deleteNotif: (notificationId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Database States loaded from APIs — all start empty
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queueTokens, setQueueTokens] = useState<QueueToken[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const { profile, tempSessionId } = useAuth();

  // App Level configurations — null until loaded from DB
  const [currentClinic, setCurrentClinic] = useState<Clinic | null>(null);
  const [currentRole, setCurrentRole] = useState<'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN'>('PATIENT');
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Synchronize dynamic session details from auth profile
  useEffect(() => {
    const id = setTimeout(() => {
      if (profile) {
        setCurrentRole(profile.role);
        setCurrentUser({
          id: profile.userId,
          name: profile.name,
          email: profile.email,
        });
        if (profile.clinicId) {
          const matchingClinic = clinics.find(c => c.id === profile.clinicId);
          if (matchingClinic) {
            setCurrentClinic(matchingClinic);
          }
        }
      } else if (tempSessionId) {
        setCurrentRole('PATIENT');
        setCurrentUser({
          id: tempSessionId,
          name: 'Anonymous Patient',
          email: '',
        });
      }
    }, 0);
    return () => clearTimeout(id);
  }, [profile, tempSessionId, clinics]);

  // --- Fetch clinics and doctors from the database on mount ---
  const fetchClinicsAndDoctors = useCallback(async () => {
    try {
      // Fetch all clinics the user has access to
      const clinicsRes = await fetch('/api/clinics/search?query=');
      if (clinicsRes.ok) {
        const data = (await clinicsRes.json()) as ClinicSearchDto[];
        // Map DB format to the app Clinic interface
        const mappedClinics: Clinic[] = data.map((c) => ({
          id: c.id,
          name: c.name,
          subdomain: c.subdomain,
          logo: c.logoUrl || '🏥',
          primaryColor: c.primaryColor || '#3b82f6',
          address: c.address || '',
          phone: c.phone || '',
          email: c.email || '',
          city: c.city || undefined,
          state: c.state || undefined,
          pincode: c.pincode || undefined,
        }));
        setClinics(mappedClinics);

        // Set current clinic from profile or first available
        if (profile?.clinicId) {
          const match = mappedClinics.find((c: Clinic) => c.id === profile.clinicId);
          if (match) setCurrentClinic(match);
        } else if (mappedClinics.length > 0 && !currentClinic) {
          setCurrentClinic(mappedClinics[0]);
        }

        // Collect all doctors from the fetched clinic data
        const allDoctors: Doctor[] = [];
        data.forEach((c) => {
          if (c.doctors) {
            c.doctors.forEach((d) => {
              allDoctors.push({
                id: d.id,
                clinicId: c.id,
                name: d.name,
                specialization: d.specialization || '',
                roomNumber: d.roomNumber || '',
                email: d.email || '',
                phone: d.phone || '',
                avatar: d.avatarUrl || '',
                workingHours: '',
                averageConsultationTime: d.averageConsultationTime || 10,
                isActive: d.isActive === undefined ? undefined : String(d.isActive),
              });
            });
          }
        });
        setDoctors(allDoctors);
      }
    } catch (e) {
      console.error('Error fetching clinics and doctors:', e);
    }
  }, [profile?.clinicId]);

  useEffect(() => {
    const id = setTimeout(() => fetchClinicsAndDoctors(), 0);
    return () => clearTimeout(id);
  }, [fetchClinicsAndDoctors]);


  // --- CORE REFETCH UTILITIES ---

  const currentClinicId = currentClinic?.id;
  const currentUserId = currentUser?.id;

  const fetchQueueData = useCallback(async () => {
    if (!currentClinicId) return;
    try {
      const res = await fetch(`/api/queue?clinicId=${currentClinicId}`);
      if (res.ok) {
        const data = await res.json();
        setQueueTokens(data);
      }
    } catch (e) {
      console.error('Error fetching live queue data:', e);
    }
  }, [currentClinicId]);

  const fetchUserNotifications = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((n: Notification & { sentAt?: string }) => ({
          ...n,
          time: n.sentAt ? new Date(n.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        }));
        setNotifications(mapped);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  }, [currentUserId]);

  const fetchUserData = useCallback(async () => {
    if (!currentUserId || !currentClinicId) return;
    try {
      // 1. Fetch appointments
      const apptRes = await fetch(`/api/appointments?role=${currentRole}&userId=${currentUserId}&clinicId=${currentClinicId}`);
      if (apptRes.ok) {
        const appts = await apptRes.json();
        setAppointments(appts);
      }

      // 2. Fetch patient's own reports and visits (patients only).
      // Staff (DOCTOR/ADMIN) fetch a specific patient's records via
      // fetchPatientRecords when a queue token is active.
      if (currentRole === 'PATIENT') {
        const repRes = await fetch(`/api/reports?userId=${currentUserId}`);
        if (repRes.ok) setReports(await repRes.json());

        const visRes = await fetch(`/api/visits?userId=${currentUserId}`);
        if (visRes.ok) setVisits(await visRes.json());
      }

      // 3. Admin/super-admin fetch the clinic patient roster for the directory.
      if (currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN') {
        const patRes = await fetch(`/api/admin/patients?clinicId=${currentClinicId}`);
        if (patRes.ok) setPatients(await patRes.json());
      }
    } catch (e) {
      console.error('Error fetching user relative data:', e);
    }
  }, [currentUserId, currentRole, currentClinicId]);

  // Fetch a specific patient's medical reports and visit history.
  // Used by staff (DOCTOR/ADMIN/SUPER_ADMIN) viewing an active token;
  // the server scopes the lookup to the session's clinic (fail-closed).
  const fetchPatientRecords = useCallback(async (patientId: string) => {
    if (!patientId) return;
    try {
      const [repRes, visRes] = await Promise.all([
        fetch(`/api/reports?patientId=${encodeURIComponent(patientId)}`),
        fetch(`/api/visits?patientId=${encodeURIComponent(patientId)}`),
      ]);
      if (repRes.ok) setReports(await repRes.json());
      if (visRes.ok) setVisits(await visRes.json());
    } catch (e) {
      console.error('Error fetching patient records:', e);
    }
  }, []);

  // Load initial clinic setup — sync user profile to DB
  useEffect(() => {
    if (!currentUser?.id) return;
    const runProfileSync = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch(`/api/auth/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: currentRole,
            accessToken: session?.access_token,
          }),
        });
        fetchQueueData();
      } catch (err) {
        console.error('Init sync error:', err);
      }
    };
    runProfileSync();
  }, [currentUser?.id, currentClinic?.id, currentRole, fetchQueueData]);

  // Refetch when user context changes
  useEffect(() => {
    const id = setTimeout(() => {
      fetchUserData();
      fetchUserNotifications();
    }, 0);
    return () => clearTimeout(id);
  }, [currentUser?.id, currentRole, currentClinic?.id, fetchUserData, fetchUserNotifications]);

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
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          console.log('Realtime QueueToken table updated:', payload);
          fetchQueueData();

          // Check if a patient was called, to trigger Text-To-Speech announcement locally
          if (payload.eventType === 'UPDATE' && payload.new.status === 'CALLED' && payload.old.status !== 'CALLED') {
            const tk = payload.new;
            const doc = doctors.find(d => d.id === tk.doctorId);
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
  }, [theme, fetchQueueData, doctors]);

  // Clinic Tenant Selector
  const setClinicById = (id: string) => {
    const target = clinics.find(c => c.id === id);
    if (target) {
      setCurrentClinic(target);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
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
        clinicId: currentClinic?.id,
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
        clinicId: currentClinic?.id,
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
    if (currentClinic) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: [currentClinic.primaryColor, '#10b981', '#34d399'],
      });
    }

    return token;
  };

  // Patient: upload report
  const uploadReport = async (file: File, reportType: string, fileType: 'pdf' | 'image') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('reportType', reportType);
    formData.append('fileType', fileType);

    const res = await fetch('/api/reports', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      fetchUserData();
      addNotification('Report Uploaded', `Your report ${file.name} was shared with your doctor.`, 'PUSH');
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
        clinicId: currentClinic?.id,
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

  const callPrevious = async (doctorId: string) => {
    const res = await fetch('/api/queue/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'call-previous',
        doctorId,
      }),
    });

    if (res.ok) {
      fetchQueueData();
      addNotification('Queue Restored', 'Called previous patient.', 'PUSH');
    }
  };

  const transferPatient = async (tokenId: string, targetDoctorId: string) => {
    const res = await fetch('/api/queue/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'transfer',
        tokenId,
        targetDoctorId,
        performedBy: currentUser?.id,
      }),
    });

    if (res.ok) {
      fetchQueueData();
      addNotification('Patient Transferred', 'Waiting list updated.', 'PUSH');
    }
  };

  const cancelPatientToken = async (tokenId: string) => {
    const res = await fetch('/api/queue/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cancel',
        tokenId,
        performedBy: currentUser?.id,
      }),
    });

    if (res.ok) {
      fetchQueueData();
      addNotification('Token Cancelled', 'Waiting queue updated.', 'PUSH');
    }
  };

  const markNotifAsRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      if (res.ok) {
        fetchUserNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllNotifsAsRead = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, markAll: true }),
      });
      if (res.ok) {
        fetchUserNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotif = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications?notificationId=${notificationId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchUserNotifications();
      }
    } catch (e) {
      console.error(e);
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
      callPrevious,
      transferPatient,
      cancelPatientToken,
      markNotifAsRead,
      markAllNotifsAsRead,
      deleteNotif,
      theme,
      toggleTheme,
      triggerVoiceAnnouncement,
      fetchQueueData,
      fetchPatientRecords,
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
