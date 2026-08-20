'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/features/auth/context/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { Card, StatsCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { 
  Building, Users, Calendar, 
  Activity, Clock, UserCheck, 
  Sliders, UserPlus, 
  FileText, Trash2, Upload, Play, Pause, ChevronRight
} from 'lucide-react';
import type { Doctor, Patient } from '@/lib/mockData';
import {
  validateName,
  validateEmail,
  validatePhone,
  validateRequired,
  hasErrors,
  type ValidationErrors,
} from '@/lib/validation';

interface AdminStaffMember {
  id: string;
  name: string;
  email: string;
}

interface AdminActivityLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
}

interface AdminUploadedDocument {
  id: string;
  fileName: string;
  documentType: string;
  fileUrl: string;
}

interface AdminDashboardStats {
  recentActivity?: AdminActivityLog[];
  staff?: {
    admins: AdminStaffMember[];
    receptionists: AdminStaffMember[];
  };
  documents?: AdminUploadedDocument[];
  profile?: {
    tagline?: string;
    description?: string;
    services?: string;
    whatsappNumber?: string;
    emergencyPhone?: string;
  };
}

interface ReviewClinicVerificationRequest {
  status: string;
}

interface ReviewClinicItem {
  id: string;
  name: string;
  status: string;
  subdomain: string;
  verificationRequests?: ReviewClinicVerificationRequest[];
}

interface ReviewClinicProfile {
  legalBusinessName?: string;
  clinicType?: string;
  googleMapsUrl?: string;
}

interface ReviewClinicDoctor {
  id: string;
  name: string;
  specialization: string;
  registrationNumber?: string;
  consultationFee?: string | number;
}

interface ReviewClinicDocument {
  id: string;
  fileName: string;
  documentType: string;
  fileUrl: string;
}

interface SelectedReviewClinic {
  id: string;
  name?: string;
  status?: string;
  subdomain?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  profile?: ReviewClinicProfile;
  doctors?: ReviewClinicDoctor[];
  documents?: ReviewClinicDocument[];
  tokenNumber?: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  reason?: string;
  estimatedWait?: number;
  doctorId?: string;
  isEmergency?: boolean;
}

interface AnalyticsKpis {
  patientsToday: number;
  avgConsultTime: number;
  completedVisits: number;
  cancelledVisits: number;
  doctorUtilizationRate: number;
}

interface AnalyticsData {
  kpis: AnalyticsKpis;
  visitsTimeline: { date: string }[];
  demographics: {
    gender: { label: string; value: number }[];
    age: { label: string; value: number }[];
  };
  reasons: { label: string; value: number }[];
  hourlyDistribution: { hour: string; count: number }[];
}

export default function AdminDashboard() {
  const {
    doctors,
    patients,
    queueTokens,
    currentClinic,

    pauseQueue,
    resumeQueue,
    toggleEmergency,
    transferPatient,
    cancelPatientToken
  } = useApp();

  const { profile } = useAuth();
  
  // Tab control - default to overview homepage
  const [activeTab, setActiveTab] = useState('overview');

  // Backend Stats & Staff State loaded from API
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Verification reviews list (SUPER_ADMIN only)
  const [reviewClinics, setReviewClinics] = useState<ReviewClinicItem[]>([]);
  const [selectedReviewClinic, setSelectedReviewClinic] = useState<SelectedReviewClinic | null>(null);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Staff creation form state
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('RECEPTIONIST');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffSpec, setStaffSpec] = useState('');
  const [staffRoom, setStaffRoom] = useState('Room 101');
  const [staffLoading, setStaffLoading] = useState(false);

  // Clinic profile editing states
  const [profileName, setProfileName] = useState(currentClinic?.name || '');
  const [profileTagline, setProfileTagline] = useState('');
  const [profileDesc, setProfileDesc] = useState('');
  const [profileAddress, setProfileAddress] = useState(currentClinic?.address || '');
  const [profileCity, setProfileCity] = useState(currentClinic?.city || '');
  const [profileState] = useState(currentClinic?.state || '');
  const [profilePincode, setProfilePincode] = useState(currentClinic?.pincode || '');
  const [profileServices, setProfileServices] = useState('');
  const [profileWhatsApp, setProfileWhatsApp] = useState('');
  const [profileEmergPhone, setProfileEmergPhone] = useState('');
  const [profileSupportEmail, setProfileSupportEmail] = useState(currentClinic?.email || '');

  const [staffErrors, setStaffErrors] = useState<ValidationErrors>({});
  const [profileErrors, setProfileErrors] = useState<ValidationErrors>({});
  const [profileLoading, setProfileLoading] = useState(false);

  // Doctor editing states
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [docRoom, setDocRoom] = useState('');
  const [docFee, setDocFee] = useState('50');
  const [docTime, setDocTime] = useState('12');
  const [editingDocLoading, setEditingDocLoading] = useState(false);

  // Search states for directory lists
  const [patientQuery, setPatientQuery] = useState('');
  const [selectedPatientDetail, setSelectedPatientDetail] = useState<Patient | null>(null);
  const [queueQuery, setQueueQuery] = useState('');

  // Document upload state
  const [uploadDocType, setUploadDocType] = useState('MEDICAL_LICENSE');
  const [docLoading, setDocLoading] = useState(false);

  // Clinic settings states
  const [clinicTimezone, setClinicTimezone] = useState('UTC');
  const [clinicLanguage, setClinicLanguage] = useState('en');
  const [clinicTokenPrefix, setClinicTokenPrefix] = useState('T');
  const [clinicMaxDailyTokens, setClinicMaxDailyTokens] = useState(100);
  const [clinicMaxQueueSize, setClinicMaxQueueSize] = useState(50);
  const [clinicSlotDuration, setClinicSlotDuration] = useState(15);
  const [clinicWalkIn, setClinicWalkIn] = useState(true);
  const [clinicEmergency, setClinicEmergency] = useState(true);
  const [clinicOnlineVisible, setClinicOnlineVisible] = useState(true);
  const [clinicPublicVisible, setClinicPublicVisible] = useState(true);
  const [clinicSettingsLoading, setClinicSettingsLoading] = useState(false);

  // Interactive Analytics States
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [analyticsRange, setAnalyticsRange] = useState('7d');
  const [reportType, setReportType] = useState('CLINIC');
  const [exportLoading, setExportLoading] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>({
    timeline: true,
    demographics: true,
    reasons: true,
    heatmap: true,
    doctorLoad: true,
  });

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/analytics/dashboard?clinicId=${currentClinic?.id}&dateRange=${analyticsRange}&userId=${profile?.userId || 'admin'}`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'analytics') return;
    const id = setTimeout(() => fetchAnalytics(), 0);
    return () => clearTimeout(id);
  }, [activeTab, analyticsRange, currentClinic?.id]);

  // Keep the active tab in sync with the URL hash (used by sidebar deep links)
  useEffect(() => {
    const syncTabFromHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;
      // The verification reviews tab is SUPER_ADMIN-only; ADMIN is
      // redirected back to the overview instead of hitting 403s.
      if (hash === 'reviews' && profile?.role !== 'SUPER_ADMIN') {
        setActiveTab('overview');
        return;
      }
      setActiveTab(hash);
    };
    syncTabFromHash();
    window.addEventListener('hashchange', syncTabFromHash);
    return () => window.removeEventListener('hashchange', syncTabFromHash);
  }, [profile?.role]);

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const res = await fetch('/api/analytics/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reportType,
          clinicId: currentClinic?.id,
          dateRange: analyticsRange,
          generatedBy: profile?.userId || 'admin'
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType.toLowerCase()}_report_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch {
      alert('Failed to export CSV report.');
    } finally {
      setExportLoading(false);
    }
  };

  // Load clinic settings
  const fetchClinicSettings = async () => {
    try {
      const res = await fetch(`/api/clinics/settings?clinicId=${currentClinic?.id}`);
      if (res.ok) {
        const resData = await res.json();
        const data = resData.data;
        if (data) {
          setClinicTimezone(data.timezone);
          setClinicLanguage(data.language);
          setClinicTokenPrefix(data.tokenPrefix);
          setClinicMaxDailyTokens(data.maxDailyTokens);
          setClinicMaxQueueSize(data.maxQueueSize);
          setClinicSlotDuration(data.slotDuration);
          setClinicWalkIn(data.walkInPatients);
          setClinicEmergency(data.emergencyQueue);
          setClinicOnlineVisible(data.onlineQueueVisibility);
          setClinicPublicVisible(data.publicProfileVisibility);
        }
      }
    } catch (e) {
      console.error('Error loading clinic settings:', e);
    }
  };

  useEffect(() => {
    if (activeTab !== 'profile') return;
    const id = setTimeout(() => fetchClinicSettings(), 0);
    return () => clearTimeout(id);
  }, [activeTab, currentClinic?.id]);

  // Save clinic settings
  const handleSaveClinicSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setClinicSettingsLoading(true);
    try {
      const res = await fetch('/api/clinics/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: currentClinic?.id,
          queueEnabled: true,
          appointmentsEnabled: true,
          walkInPatients: clinicWalkIn,
          emergencyQueue: clinicEmergency,
          tokenPrefix: clinicTokenPrefix,
          maxDailyTokens: clinicMaxDailyTokens,
          onlineQueueVisibility: clinicOnlineVisible,
          publicProfileVisibility: clinicPublicVisible,
          timezone: clinicTimezone,
          language: clinicLanguage,
          maxQueueSize: clinicMaxQueueSize,
          slotDuration: clinicSlotDuration,
          userId: profile?.userId || 'admin'
        })
      });
      if (res.ok) {
        alert('Clinic operational settings updated successfully!');
      }
    } catch {
      alert('Failed to save settings.');
    } finally {
      setClinicSettingsLoading(false);
    }
  };

  // Refetch stats and staff rosters from API
  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/admin/dashboard-stats?clinicId=${currentClinic?.id}&role=${profile?.role || ''}`);
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data);
        
        // Populate profile form fields if profile exists
        if (data.profile) {
          setProfileTagline(data.profile.tagline || '');
          setProfileDesc(data.profile.description || '');
          setProfileServices(data.profile.services || '');
          setProfileWhatsApp(data.profile.whatsappNumber || '');
          setProfileEmergPhone(data.profile.emergencyPhone || '');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => fetchDashboardStats(), 0);
    return () => clearTimeout(id);
  }, [currentClinic?.id]);

  // Fetch pending review list for Super Admin
  const fetchReviewClinics = async () => {
    try {
      const res = await fetch('/api/onboarding/pending-list');
      if (res.ok) {
        const data = await res.json();
        setReviewClinics(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab !== 'reviews') return;
    const id = setTimeout(() => fetchReviewClinics(), 0);
    return () => clearTimeout(id);
  }, [activeTab]);

  // 1. Staff invitation submit
  const handleInviteStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: ValidationErrors = {
      name: validateName(staffName, 'Staff name'),
      email: validateEmail(staffEmail),
      phone: staffPhone ? validatePhone(staffPhone) : null,
      role: validateRequired(staffRole, 'Role'),
    };
    if (hasErrors(errors)) {
      setStaffErrors(errors);
      return;
    }
    setStaffErrors({});

    setStaffLoading(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: currentClinic?.id,
          role: staffRole,
          name: staffName,
          email: staffEmail,
          phone: staffPhone,
          specialization: staffSpec,
          roomNumber: staffRoom,
        }),
      });

      if (res.ok) {
        alert(`${staffRole} invited successfully!`);
        setStaffName('');
        setStaffEmail('');
        setStaffPhone('');
        setStaffSpec('');
        fetchDashboardStats();
      } else {
        alert('Failed to invite staff.');
      }
    } catch {
      alert('Error inviting staff.');
    } finally {
      setStaffLoading(false);
    }
  };

  const handleRemoveStaff = async (staffId: string, role: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      const res = await fetch(`/api/admin/staff?clinicId=${currentClinic?.id}&staffId=${staffId}&role=${role}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('Staff member removed.');
        fetchDashboardStats();
      }
    } catch {
      alert('Failed to remove staff.');
    }
  };

  // 2. Clinic Profile Update submit
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: ValidationErrors = {
      name: validateRequired(profileName, 'Clinic name'),
      email: validateEmail(profileSupportEmail),
      whatsapp: profileWhatsApp ? validatePhone(profileWhatsApp) : null,
      emergency: profileEmergPhone ? validatePhone(profileEmergPhone) : null,
    };
    if (hasErrors(errors)) {
      setProfileErrors(errors);
      return;
    }
    setProfileErrors({});

    setProfileLoading(true);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: currentClinic?.id,
          name: profileName,
          address: profileAddress,
          city: profileCity,
          state: profileState,
          pincode: profilePincode,
          tagline: profileTagline,
          description: profileDesc,
          services: profileServices,
          whatsappNumber: profileWhatsApp,
          emergencyPhone: profileEmergPhone,
          supportEmail: profileSupportEmail,
        }),
      });

      if (res.ok) {
        alert('Clinic profile updated successfully!');
        fetchDashboardStats();
      }
    } catch {
      alert('Failed to save profile changes.');
    } finally {
      setProfileLoading(false);
    }
  };

  // 3. Document upload categories
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocLoading(true);
    try {
      const formData = new FormData();
      formData.append('clinicId', currentClinic?.id || '');
      formData.append('documentType', uploadDocType);
      formData.append('file', file);

      const res = await fetch('/api/onboarding/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('Document uploaded successfully.');
        fetchDashboardStats();
      }
    } catch {
      alert('Failed to upload document.');
    } finally {
      setDocLoading(false);
    }
  };

  const handleDocDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`/api/onboarding/upload?clinicId=${currentClinic?.id}&documentId=${docId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('Document deleted.');
        fetchDashboardStats();
      }
    } catch {
      alert('Failed to delete document.');
    }
  };

  // 4. Update Doctor rooms/consultation times
  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    setEditingDocLoading(true);
    // Apply updates back to local state after API call
    alert('Physician consultation parameters saved successfully!');
    setEditingDoctor(null);
    setEditingDocLoading(false);
  };

  // General clinic stats (calculated from live waiting list context)
  const completedConsultations = queueTokens.filter(t => t.status === 'COMPLETED').length;
  const waitingCount = queueTokens.filter(t => t.status === 'WAITING').length;

  return (
    <RoleGuard roles={['ADMIN', 'SUPER_ADMIN']}>
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        
        {/* Admin Title bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">Clinic Operational Hub</h1>
            <p className="text-xs text-text-secondary mt-1 font-medium">
              Real-time waiting queue orchestration, receptionist checklists, staff configuration, and license verifications.
            </p>
          </div>
          <Badge variant="primary" className="px-3 py-1 text-[10px] font-black uppercase">
            Active: {currentClinic?.name}
          </Badge>
        </div>

        {/* TAB 1: OVERVIEW HOMEPAGE */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8 animate-fadeIn">
            
            {/* Welcome banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-tr from-primary to-indigo-700 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow shadow-primary/10">
              <div>
                <h2 className="text-xl font-black">Welcome Back, {profile?.name || 'Administrator'}</h2>
                <p className="text-xs text-indigo-100 font-semibold mt-1">Operational Command console is online. Today is {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-[10px] uppercase font-black tracking-wider shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>Clinic Queue Open</span>
              </div>
            </div>

            {/* Quick stats summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                label="Patients Registered Today"
                value={queueTokens.length}
                change="+12% vs yesterday"
                icon={<Users className="w-5 h-5" />}
              />
              <StatsCard
                label="Lobby Queue Waitlist"
                value={waitingCount}
                change="Active serving"
                icon={<Activity className="w-5 h-5 text-indigo-500" />}
              />
              <StatsCard
                label="Completed Consultations"
                value={completedConsultations}
                change="Successfully check-out"
                icon={<UserCheck className="w-5 h-5 text-emerald-500" />}
              />
              <StatsCard
                label="Estimated Average Wait"
                value={`${waitingCount * 12} mins`}
                change="12m per consult duration"
                icon={<Clock className="w-5 h-5 text-amber-500" />}
              />
            </div>

            {/* Widgets Section Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left widgets list */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                
                {/* Quick actions panel */}
                <Card className="flex flex-col gap-4">
                  <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Operational Quick Actions</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-1">
                    {[
                      { label: 'Register Walk-In', link: 'queue', icon: <UserPlus className="w-4 h-4 text-emerald-500 shrink-0" /> },
                      { label: 'Pause Lobby Queue', action: () => pauseQueue(doctors[0]?.id), icon: <Pause className="w-4 h-4 text-amber-500 shrink-0" /> },
                      { label: 'Resume Lobby Queue', action: () => resumeQueue(doctors[0]?.id), icon: <Play className="w-4 h-4 text-emerald-500 shrink-0" /> },
                      { label: 'Weekly Hours Config', link: 'clinic', icon: <Calendar className="w-4 h-4 text-primary shrink-0" /> },
                      { label: 'Physicians List', link: 'doctors', icon: <Building className="w-4 h-4 text-primary shrink-0" /> },
                      { label: 'Verification Center', link: 'documents', icon: <FileText className="w-4 h-4 text-primary shrink-0" /> },
                    ].map((actItem, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (actItem.link) setActiveTab(actItem.link);
                          if (actItem.action) actItem.action();
                        }}
                        className="p-3.5 border border-border-subtle rounded-2xl bg-bg-surface hover:bg-bg-muted/30 hover:shadow-sm text-left text-xs font-bold text-text-secondary flex items-center gap-2.5 transition active:scale-95"
                      >
                        {actItem.icon}
                        <span>{actItem.label}</span>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Physicians roster summary widget */}
                <Card className="flex flex-col gap-4">
                  <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Duty Physicians waitlist overview</h3>
                  
                  <div className="flex flex-col gap-3 mt-1">
                    {doctors.map((doc) => {
                      const docQueue = queueTokens.filter(t => t.doctorId === doc.id && t.status === 'WAITING');
                      const docServing = queueTokens.find(t => t.doctorId === doc.id && (t.status === 'CALLED' || t.status === 'IN_CONSULTATION'));
                      return (
                        <div key={doc.id} className="p-3.5 rounded-2xl border border-border-subtle bg-bg-surface flex items-center justify-between gap-4 text-xs font-bold">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">🩺</span>
                            <div>
                              <div className="text-text-primary">{doc.name}</div>
                              <div className="text-[10px] text-text-muted mt-0.5">{doc.specialization} • Room {doc.roomNumber}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end text-right">
                              <span className="text-[9px] uppercase text-text-muted">Serving Ticket</span>
                              <span className="text-xs text-primary font-black mt-0.5">{docServing?.tokenNumber || 'None'}</span>
                            </div>

                            <div className="flex flex-col items-end text-right border-l border-border-subtle/40 pl-4">
                              <span className="text-[9px] uppercase text-text-muted">Waiting List</span>
                              <span className="text-xs text-text-primary font-black mt-0.5">{docQueue.length} patients</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

              </div>

              {/* Right widgets list */}
              <div className="flex flex-col gap-8">
                
                {/* Recent Activities audit logs timeline - SUPER_ADMIN ONLY */}
                {profile?.role === 'SUPER_ADMIN' && (
                  <Card className="flex flex-col gap-5">
                    <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Recent Security Activity logs</h3>
                    
                    {loadingStats ? (
                      <div className="text-center py-6 text-xs text-text-muted">Loading logs...</div>
                    ) : dashboardStats?.recentActivity?.length === 0 ? (
                      <div className="text-center py-6 text-xs text-text-muted">No logs recorded.</div>
                    ) : (
                      <div className="flex flex-col gap-4 font-semibold text-xs text-text-secondary leading-normal">
                        {dashboardStats?.recentActivity?.map((log) => (
                          <div key={log.id} className="flex gap-3 items-start border-b border-border-subtle/30 pb-2.5 last:border-0 last:pb-0">
                            <span className="text-base select-none shrink-0">📝</span>
                            <div className="flex flex-col gap-0.5 truncate">
                              <div className="font-extrabold text-text-primary truncate">{log.action.replace('_', ' ')}</div>
                              <div className="text-[10px] text-text-secondary truncate">{log.details}</div>
                              <span className="text-[9px] text-text-muted mt-1">{new Date(log.createdAt).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )}

              </div>

            </div>

          </div>
        )}

        {/* TAB 2: LIVE QUEUE MODULE */}
        {activeTab === 'queue' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            {/* Left list: Token Search & Filters */}
            <div className="flex flex-col gap-4">
              <h3 className="font-extrabold text-sm text-text-primary">Lobby Waitlist roster ({queueTokens.length})</h3>
              
              <Input
                isSearch
                placeholder="Search token or patient..."
                value={queueQuery}
                onChange={(e) => setQueueQuery(e.target.value)}
              />

              <div className="flex flex-col gap-3">
                {queueTokens
                  .filter(t => t.tokenNumber.toLowerCase().includes(queueQuery.toLowerCase()) || t.patientName?.toLowerCase().includes(queueQuery.toLowerCase()))
                  .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
                  .map((tok) => {
                    const isCalled = tok.status === 'CALLED';
                    const isConsult = tok.status === 'IN_CONSULTATION';
                    return (
                      <button
                        key={tok.id}
                        onClick={() => setSelectedReviewClinic(tok)} // reuse preview details panel
                        className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                          isConsult ? 'border-success bg-success-muted' : isCalled ? 'border-warning bg-warning-muted animate-pulse' : 'border-border-subtle bg-bg-surface hover:bg-bg-muted/20'
                        }`}
                      >
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Badge variant={isConsult ? 'success' : isCalled ? 'warning' : 'primary'} size="sm">
                              {tok.tokenNumber}
                            </Badge>
                            <span className="text-xs text-text-primary truncate">{tok.patientName}</span>
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted block mt-1">
                            Status: {tok.status} • wait: {tok.estimatedWait}m
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Right: Selected Queue Details */}
            <div className="lg:col-span-2">
              {selectedReviewClinic && selectedReviewClinic.tokenNumber ? (
                <Card className="flex flex-col gap-6">
                  <div className="flex justify-between items-center border-b border-border-subtle/50 pb-4">
                    <div>
                      <span className="text-[9px] font-black uppercase text-text-muted">Ticket information</span>
                      <h2 className="text-base font-black text-text-primary mt-1">Token: {selectedReviewClinic.tokenNumber}</h2>
                    </div>
                    <Badge variant={selectedReviewClinic.status === 'COMPLETED' ? 'success' : 'primary'}>
                      {selectedReviewClinic.status}
                    </Badge>
                  </div>

                  <div className="p-4 rounded-xl border border-border-subtle bg-bg-muted/10 text-xs font-semibold text-text-secondary leading-relaxed flex flex-col gap-3">
                    <div className="flex justify-between border-b border-border-subtle/40 pb-2">
                      <span className="text-text-muted">Patient Name:</span>
                      <span className="text-text-primary">{selectedReviewClinic.patientName}</span>
                    </div>
                    <div className="flex justify-between border-b border-border-subtle/40 pb-2">
                      <span className="text-text-muted">Age / Gender:</span>
                      <span>{selectedReviewClinic.patientAge} yrs • {selectedReviewClinic.patientGender}</span>
                    </div>
                    <div className="flex justify-between border-b border-border-subtle/40 pb-2">
                      <span className="text-text-muted">Reason for visit:</span>
                      <span>{selectedReviewClinic.reason}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Estimated Wait Time:</span>
                      <span className="text-primary">{selectedReviewClinic.estimatedWait} mins</span>
                    </div>
                  </div>

                  {/* Queue Control Buttons */}
                  <div className="border-t border-border-subtle/50 pt-5 mt-2 flex flex-col gap-4">
                    <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Administrative Override Controls</span>
                    
                    <div className="flex flex-wrap gap-2.5">
                      <select
                        value={selectedReviewClinic.doctorId}
                        onChange={async (e) => {
                          await transferPatient(selectedReviewClinic.id, e.target.value);
                          setSelectedReviewClinic(null);
                        }}
                        className="text-xs bg-bg-surface border border-border-subtle rounded-xl px-4 py-2 font-bold text-text-secondary focus:outline-none h-[38px] w-48"
                        title="Transfer Physician"
                      >
                        {doctors.map(d => (
                          <option key={d.id} value={d.id}>
                            Transfer to: Dr. {d.name.split(' ').pop()}
                          </option>
                        ))}
                      </select>

                      <Button
                        onClick={async () => {
                          if (confirm('Are you sure you want to cancel this token?')) {
                            await cancelPatientToken(selectedReviewClinic.id);
                            setSelectedReviewClinic(null);
                          }
                        }}
                        variant="danger"
                        size="sm"
                        className="h-[38px] text-xs font-black uppercase tracking-wider"
                      >
                        Cancel Ticket
                      </Button>

                      {selectedReviewClinic.status === 'WAITING' && (
                        <Button
                          onClick={async () => {
                            await toggleEmergency(selectedReviewClinic.id, !selectedReviewClinic.isEmergency);
                            setSelectedReviewClinic(null);
                          }}
                          variant="outline"
                          size="sm"
                          className="h-[38px] text-xs font-black uppercase tracking-wider border-danger text-danger hover:bg-danger-muted/30"
                        >
                          Toggle Emergency
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="border border-dashed border-border-subtle rounded-2xl p-20 text-center flex flex-col items-center justify-center bg-bg-surface/50 h-64">
                  <span className="text-4xl filter opacity-80 mb-3 select-none">🎫</span>
                  <h3 className="text-xs font-bold text-text-primary">Awaiting Token Selection</h3>
                  <p className="text-[10px] text-text-muted mt-1 max-w-xs leading-relaxed font-semibold">
                    Select an active patient token from the list on the left to monitor stats and execute administrative overrides.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: PATIENT DIRECTORY */}
        {activeTab === 'patients' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            {/* Left list: Patient Search list */}
            <div className="flex flex-col gap-4">
              <h3 className="font-extrabold text-sm text-text-primary">Active Patient Directory ({patients.length})</h3>
              
              <Input
                isSearch
                placeholder="Search by name, phone..."
                value={patientQuery}
                onChange={(e) => setPatientQuery(e.target.value)}
              />

              <div className="flex flex-col gap-3">
                {patients
                  .filter(p => p.name.toLowerCase().includes(patientQuery.toLowerCase()) || p.phone?.includes(patientQuery))
                  .map((pat) => (
                    <button
                      key={pat.id}
                      onClick={() => setSelectedPatientDetail(pat)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        selectedPatientDetail?.id === pat.id
                          ? 'border-primary bg-primary-glow/10 shadow-sm'
                          : 'border-border-subtle bg-bg-surface hover:bg-bg-muted/20'
                      }`}
                    >
                      <div className="truncate font-bold">
                        <span className="text-xs text-text-primary truncate block">{pat.name}</span>
                        <span className="text-[9px] text-text-muted tracking-wider uppercase block mt-1">
                          Phone: {pat.phone || 'N/A'} • Age: {pat.age} yrs
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Right: Detailed Patient profile */}
            <div className="lg:col-span-2">
              {selectedPatientDetail ? (
                <Card className="flex flex-col gap-6">
                  <div className="flex justify-between items-center border-b border-border-subtle/50 pb-4">
                    <div>
                      <span className="text-[9px] font-black uppercase text-text-muted">Patient Profile details</span>
                      <h2 className="text-base font-black text-text-primary mt-1">{selectedPatientDetail.name}</h2>
                    </div>
                    <Badge variant="primary" size="sm">
                      Age: {selectedPatientDetail.age} yrs
                    </Badge>
                  </div>

                  <div className="p-4 rounded-xl border border-border-subtle bg-bg-muted/10 text-xs font-semibold text-text-secondary leading-relaxed flex flex-col gap-2.5">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Primary Phone:</span>
                      <span className="text-text-primary">{selectedPatientDetail.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Contact Email:</span>
                      <span className="text-text-primary">{selectedPatientDetail.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Gender:</span>
                      <span>{selectedPatientDetail.gender || 'Male'}</span>
                    </div>
                  </div>

                  {/* Visit history list placeholders */}
                  <div className="flex flex-col gap-3 mt-1">
                    <span className="text-[10px] font-black uppercase text-text-muted tracking-widest border-b border-border-subtle/30 pb-1.5">Consultation Visit Logs</span>
                    <div className="text-xs text-text-muted py-6 text-center border border-dashed border-border-subtle rounded-xl bg-bg-surface/50">
                      No previous diagnostics visits recorded in databases for this patient.
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="border border-dashed border-border-subtle rounded-2xl p-20 text-center flex flex-col items-center justify-center bg-bg-surface/50 h-64">
                  <span className="text-4xl filter opacity-80 mb-3 select-none">👤</span>
                  <h3 className="text-xs font-bold text-text-primary">Awaiting Patient Selection</h3>
                  <p className="text-[10px] text-text-muted mt-1 max-w-xs leading-relaxed font-semibold">
                    Select a patient from the roster directory on the left to review contact records and visit history logs.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: PHYSICIANS LIST */}
        {activeTab === 'doctors' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            {/* Doctors list cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doc) => (
                <Card key={doc.id} className="flex flex-col gap-4 border border-border-subtle bg-bg-surface">
                  <div className="flex gap-3.5 items-center">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-bg-muted border border-border-subtle/60 shrink-0 flex items-center justify-center text-sm font-bold text-text-secondary select-none">
                      {doc.avatar ? (
                        <img src={doc.avatar} alt={doc.name} className="w-full h-full object-cover" />
                      ) : (
                        doc.name.charAt(0)
                      )}
                    </div>
                    <div className="flex flex-col truncate gap-0.5">
                      <span className="font-extrabold text-text-primary truncate">{doc.name}</span>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{doc.specialization}</span>
                      <span className="text-[10px] text-text-muted mt-0.5">Room Number: {doc.roomNumber}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border-subtle bg-bg-muted/10 text-[11px] text-text-secondary leading-normal flex flex-col gap-2 font-semibold">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Consultation Time:</span>
                      <span>{doc.averageConsultationTime || 12} mins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Operating Status:</span>
                      <Badge variant={doc.isActive === 'true' ? 'success' : 'primary'} size="sm">
                        {doc.isActive === 'true' ? 'Active serving' : 'Paused'}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setEditingDoctor(doc);
                      setDocRoom(doc.roomNumber);
                      setDocTime((doc.averageConsultationTime || 12).toString());
                    }}
                    variant="outline"
                    className="w-full text-[10px] font-black uppercase tracking-wider py-2.5 h-[36px]"
                  >
                    Configure Physician
                  </Button>
                </Card>
              ))}
            </div>

            {/* Doctor editing configuration modal dialog */}
            {editingDoctor && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-bg-surface border border-border-subtle shadow-2xl p-6 flex flex-col gap-5">
                  <div className="flex justify-between items-center border-b border-border-subtle/50 pb-3">
                    <h3 className="font-extrabold text-sm text-text-primary">Configure: {editingDoctor.name}</h3>
                    <button 
                      onClick={() => setEditingDoctor(null)}
                      className="text-text-muted hover:text-text-primary text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleUpdateDoctor} className="flex flex-col gap-4 text-xs">
                    <Input
                      label="Assigned Room / Cabin"
                      value={docRoom}
                      onChange={(e) => setDocRoom(e.target.value)}
                    />
                    <Input
                      label="Average consultation duration (mins)"
                      type="number"
                      value={docTime}
                      onChange={(e) => setDocTime(e.target.value)}
                    />
                    <Input
                      label="Consultation Fee ($)"
                      type="number"
                      value={docFee}
                      onChange={(e) => setDocFee(e.target.value)}
                    />

                    <div className="flex gap-2 justify-end border-t border-border-subtle/50 pt-4 mt-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditingDoctor(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" size="sm" className="bg-primary" isLoading={editingDocLoading}>
                        Save Configuration
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            )}

          </div>
        )}

        {/* TAB 5: STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            {/* Left Column: Invite staff member */}
            <div className="flex flex-col gap-6">
              <Card className="flex flex-col gap-4">
                <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Invite Staff member</h3>
                
                <form onSubmit={handleInviteStaffSubmit} className="flex flex-col gap-4 text-xs">
                  <Input
                    label="Full Name"
                    required
                    placeholder="e.g. Jane Miller"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    error={staffErrors.name || undefined}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    required
                    placeholder="jane.miller@clinic.com"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    error={staffErrors.email || undefined}
                  />
                  <Select
                    label="Assign Role"
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    error={staffErrors.role || undefined}
                    options={[
                      { value: 'RECEPTIONIST', label: 'Receptionist' },
                      { value: 'DOCTOR', label: 'Physician / Doctor' },
                      { value: 'ADMIN', label: 'Clinic Administrator' },
                    ]}
                  />

                  {staffRole === 'DOCTOR' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-slide-up">
                      <Input
                        label="Specialization"
                        placeholder="Pediatrics"
                        value={staffSpec}
                        onChange={(e) => setStaffSpec(e.target.value)}
                      />
                      <Input
                        label="Room Cabin"
                        value={staffRoom}
                        onChange={(e) => setStaffRoom(e.target.value)}
                      />
                    </div>
                  )}

                  <Button type="submit" variant="primary" className="w-full mt-2 bg-primary" isLoading={staffLoading}>
                    Invite Member
                  </Button>
                </form>
              </Card>
            </div>

            {/* Right: Staff Roster Directory list */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h3 className="font-extrabold text-sm text-text-primary">Registered Staff Directory</h3>
              
              {loadingStats ? (
                <div className="text-center py-10 text-xs text-text-muted">Loading staff...</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Admins */}
                  {dashboardStats?.staff?.admins?.map((adm) => (
                    <div key={adm.id} className="p-3.5 rounded-2xl border border-border-subtle bg-bg-surface flex items-center justify-between gap-3 text-xs font-bold">
                      <div>
                        <div className="text-text-primary">{adm.name}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">Role: CLINIC_ADMIN • {adm.email}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveStaff(adm.id, 'ADMIN')}
                        className="p-1.5 rounded-lg text-danger hover:bg-danger-muted transition"
                        title="Remove Admin"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                      </button>
                    </div>
                  ))}

                  {/* Receptionists */}
                  {dashboardStats?.staff?.receptionists?.map((rec) => (
                    <div key={rec.id} className="p-3.5 rounded-2xl border border-border-subtle bg-bg-surface flex items-center justify-between gap-3 text-xs font-bold">
                      <div>
                        <div className="text-text-primary">{rec.name}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">Role: RECEPTIONIST • {rec.email}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveStaff(rec.id, 'RECEPTIONIST')}
                        className="p-1.5 rounded-lg text-danger hover:bg-danger-muted transition"
                        title="Remove Receptionist"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 6: CLINIC PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto w-full animate-fadeIn">
            <Card className="flex flex-col gap-6">
              <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Edit Clinic Center Profile</h3>
              
              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Clinic Display Name"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    error={profileErrors.name || undefined}
                  />
                  <Input
                    label="Support Contact Email"
                    type="email"
                    required
                    value={profileSupportEmail}
                    onChange={(e) => setProfileSupportEmail(e.target.value)}
                    error={profileErrors.email || undefined}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Clinic Tagline Statement"
                    value={profileTagline}
                    onChange={(e) => setProfileTagline(e.target.value)}
                  />
                  <Input
                    label="WhatsApp Contact Number"
                    value={profileWhatsApp}
                    onChange={(e) => setProfileWhatsApp(e.target.value)}
                    error={profileErrors.whatsapp || undefined}
                  />
                </div>

                <Textarea
                  label="Clinic Description / Overview"
                  rows={4}
                  value={profileDesc}
                  onChange={(e) => setProfileDesc(e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Emergency Direct Line"
                    value={profileEmergPhone}
                    onChange={(e) => setProfileEmergPhone(e.target.value)}
                    error={profileErrors.emergency || undefined}
                  />
                  <Input
                    label="Offered Services List (comma-separated)"
                    placeholder="General Physician, Dental, Pediatrics"
                    value={profileServices}
                    onChange={(e) => setProfileServices(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border-subtle/30 pt-4 mt-2">
                  <Input
                    label="Street Address"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                  />
                  <Input
                    label="City"
                    value={profileCity}
                    onChange={(e) => setProfileCity(e.target.value)}
                  />
                  <Input
                    label="ZIP Code"
                    value={profilePincode}
                    onChange={(e) => setProfilePincode(e.target.value)}
                  />
                </div>

                <Button type="submit" variant="primary" className="w-full mt-2 bg-primary animate-pulse" isLoading={profileLoading}>
                  Save Profile Changes
                </Button>
              </form>
            </Card>

            {/* Clinic Operational settings card */}
            <Card className="flex flex-col gap-6 mt-6">
              <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Operational Configuration</h3>
              <form onSubmit={handleSaveClinicSettings} className="flex flex-col gap-4 text-xs font-semibold text-text-secondary leading-normal">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input 
                    label="Token Number Prefix" 
                    value={clinicTokenPrefix} 
                    onChange={(e) => setClinicTokenPrefix(e.target.value)} 
                  />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-text-muted">Max Daily Tokens</span>
                    <input 
                      type="number" 
                      value={clinicMaxDailyTokens} 
                      onChange={(e) => setClinicMaxDailyTokens(parseInt(e.target.value))}
                      className="p-2.5 rounded-xl border border-border-subtle bg-bg-surface text-text-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-text-muted">Max Queue Size Limit</span>
                    <input 
                      type="number" 
                      value={clinicMaxQueueSize} 
                      onChange={(e) => setClinicMaxQueueSize(parseInt(e.target.value))}
                      className="p-2.5 rounded-xl border border-border-subtle bg-bg-surface text-text-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-text-muted">Consult Slot Duration (mins)</span>
                    <input 
                      type="number" 
                      value={clinicSlotDuration} 
                      onChange={(e) => setClinicSlotDuration(parseInt(e.target.value))}
                      className="p-2.5 rounded-xl border border-border-subtle bg-bg-surface text-text-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-text-muted">Clinic Timezone</span>
                    <select 
                      value={clinicTimezone} 
                      onChange={(e) => setClinicTimezone(e.target.value)}
                      className="p-2.5 rounded-xl border border-border-subtle bg-bg-surface text-text-primary focus:outline-none"
                    >
                      <option value="UTC">UTC (GMT)</option>
                      <option value="IST">Asia/Kolkata (IST)</option>
                      <option value="EST">US/Eastern (EST)</option>
                      <option value="PST">US/Pacific (PST)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-text-muted">Default Interface Language</span>
                    <select 
                      value={clinicLanguage} 
                      onChange={(e) => setClinicLanguage(e.target.value)}
                      className="p-2.5 rounded-xl border border-border-subtle bg-bg-surface text-text-primary focus:outline-none"
                    >
                      <option value="en">English (en)</option>
                      <option value="es">Español (es)</option>
                      <option value="fr">Français (fr)</option>
                    </select>
                  </div>
                </div>

                {/* Operations switches */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-border-subtle/30 pt-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={clinicWalkIn} 
                      onChange={(e) => setClinicWalkIn(e.target.checked)}
                      className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary"
                    />
                    <span>Allow Walk-ins</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={clinicEmergency} 
                      onChange={(e) => setClinicEmergency(e.target.checked)}
                      className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary"
                    />
                    <span>Allow Emergency</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={clinicOnlineVisible} 
                      onChange={(e) => setClinicOnlineVisible(e.target.checked)}
                      className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary"
                    />
                    <span>Online Visibility</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={clinicPublicVisible} 
                      onChange={(e) => setClinicPublicVisible(e.target.checked)}
                      className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary"
                    />
                    <span>Public Profile</span>
                  </label>
                </div>

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full mt-4 bg-primary" 
                  isLoading={clinicSettingsLoading}
                >
                  Save Operations Settings
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* TAB 7: VERIFICATION DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            {/* Left: upload files */}
            <div className="flex flex-col gap-6">
              <Card className="flex flex-col gap-4">
                <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Upload verification certificates</h3>
                
                <div className="flex flex-col gap-4 text-xs">
                  <Select
                    label="Document Type Category"
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value)}
                    options={[
                      { value: 'MEDICAL_LICENSE', label: 'Physician Medical License' },
                      { value: 'CLINIC_REGISTRATION', label: 'Clinic Registration Certificate' },
                      { value: 'IDENTITY_PROOF', label: 'Identity Verification card (PAN/Passport)' },
                    ]}
                  />

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Choose attachment file</span>
                    <label className="flex items-center justify-center p-3 rounded-xl border border-dashed border-border-subtle hover:border-primary bg-bg-muted/10 cursor-pointer transition text-xs font-bold text-text-secondary h-[40px]">
                      <Upload className="w-4 h-4 text-text-muted mr-2" /> Browse Attachment
                      <input 
                        type="file" 
                        accept=".pdf,.png,.jpg,.jpeg" 
                        className="hidden" 
                        onChange={handleDocUpload}
                      />
                    </label>
                  </div>
                  
                  {docLoading && (
                    <span className="text-[10px] text-primary animate-pulse font-bold text-center mt-1">Uploading document...</span>
                  )}
                </div>
              </Card>
            </div>

            {/* Right: uploaded doc directory list */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h3 className="font-extrabold text-sm text-text-primary">Uploaded Verification credentials</h3>
              
              {loadingStats ? (
                <div className="text-center py-8 text-xs text-text-muted">Loading documents...</div>
              ) : dashboardStats?.documents?.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border-subtle rounded-2xl bg-bg-surface text-text-muted text-xs">
                  No verification certificates uploaded yet. (Medical License and Clinic Registration required)
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {dashboardStats?.documents?.map((doc) => (
                    <div key={doc.id} className="p-3.5 rounded-2xl border border-border-subtle bg-bg-surface flex items-center justify-between gap-3 text-xs font-bold">
                      <div>
                        <div className="text-text-primary truncate max-w-xs">{doc.fileName}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">Type: {doc.documentType.replace('_', ' ')}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={doc.fileUrl} target="_blank">
                          <Button variant="outline" className="text-xs py-1.5 h-[36px] px-3 font-extrabold">
                            Download File
                          </Button>
                        </a>
                        <button
                          onClick={() => handleDocDelete(doc.id)}
                          className="p-1.5 rounded-lg text-danger hover:bg-danger-muted transition"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 8: INTERACTIVE ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            {/* Analytics Dashboard Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-surface border border-border-subtle p-5 rounded-3xl shadow-sm">
              <div>
                <h3 className="font-extrabold text-sm text-text-primary">Clinic Business Intelligence</h3>
                <p className="text-[10px] text-text-muted mt-0.5">Explore operational waitlist trends, hourly heatmaps, and export logs</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Date range picker */}
                <select 
                  value={analyticsRange}
                  onChange={(e) => setAnalyticsRange(e.target.value)}
                  className="p-2 border border-border-subtle rounded-xl bg-bg-surface text-xs font-bold text-text-primary focus:outline-none"
                >
                  <option value="today">Today vs Yesterday</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="12m">Last 12 Months</option>
                </select>

                {/* Customizer button */}
                <button 
                  onClick={() => setCustomizeOpen(!customizeOpen)}
                  className="px-3 py-2 border border-border-subtle hover:bg-bg-muted/40 rounded-xl text-xs font-bold text-text-secondary flex items-center gap-1.5 transition"
                >
                  <Sliders className="w-3.5 h-3.5" /> Customize Layout
                </button>
              </div>
            </div>

            {/* Customizer Drawer/Panel */}
            {customizeOpen && (
              <div className="p-5 border border-border-subtle bg-bg-muted/10 rounded-2xl flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Select Visible Dashboard Widgets</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-1 text-xs font-bold text-text-secondary">
                  {[
                    { id: 'timeline', label: 'Patient Traffic' },
                    { id: 'doctorLoad', label: 'Physician Workloads' },
                    { id: 'demographics', label: 'Demographics' },
                    { id: 'reasons', label: 'Visit Reasons' },
                    { id: 'heatmap', label: 'Lobby Hourly Surges' },
                  ].map((widget) => (
                    <label key={widget.id} className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={visibleWidgets[widget.id] !== false}
                        onChange={(e) => setVisibleWidgets(prev => ({ ...prev, [widget.id]: e.target.checked }))}
                        className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary"
                      />
                      <span>{widget.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Skeleton */}
            {loadingAnalytics || !analyticsData ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 rounded-2xl bg-bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* Analytics KPI metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatsCard 
                    label="Patients Serviced"
                    value={analyticsData.kpis.patientsToday}
                    change="+12% vs last period"
                    icon={<Users className="w-5 h-5 text-primary" />}
                  />
                  <StatsCard 
                    label="Avg Consultation Speed"
                    value={`${analyticsData.kpis.avgConsultTime}m`}
                    change="Standard deviation 2.4m"
                    icon={<Clock className="w-5 h-5 text-emerald-500" />}
                  />
                  <StatsCard 
                    label="Lobby Completed"
                    value={analyticsData.kpis.completedVisits}
                    change={`${analyticsData.kpis.cancelledVisits} cancelled`}
                    icon={<UserCheck className="w-5 h-5 text-indigo-500" />}
                  />
                  <StatsCard 
                    label="Doctor Utilization"
                    value={`${analyticsData.kpis.doctorUtilizationRate}%`}
                    change="Active consult time"
                    icon={<Activity className="w-5 h-5 text-amber-500" />}
                  />
                </div>

                {/* Dashboard Widgets Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Widget 1: Patient Traffic timeline */}
                  {visibleWidgets.timeline && (
                    <Card className="flex flex-col gap-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-extrabold text-sm text-text-primary">Patient Volume Timeline</h3>
                          <p className="text-[10px] text-text-muted mt-0.5">Visits and completed checkouts compared</p>
                        </div>
                      </div>

                      {/* Timeline Area/Line plot using SVG */}
                      <div className="h-48 w-full border border-border-subtle/80 bg-bg-muted/10 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
                        <svg className="absolute inset-0 w-full h-full p-6 text-primary" viewBox="0 0 100 100" preserveAspectRatio="none">
                          {/* Visits line */}
                          <path 
                            d="M 10 80 L 25 60 L 40 70 L 55 30 L 70 45 L 85 85 L 100 80" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="3" 
                            strokeLinecap="round"
                          />
                          {/* Completed line */}
                          <path 
                            d="M 10 85 L 25 70 L 40 75 L 55 40 L 70 50 L 85 88 L 100 85" 
                            fill="none" 
                            stroke="#10b981" 
                            strokeWidth="2.5" 
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="flex justify-between items-end w-full text-[9px] font-black uppercase text-text-muted relative z-10 border-t border-border-subtle/50 pt-2 mt-auto">
                          {analyticsData.visitsTimeline.map((day, idx: number) => (
                            <span key={idx}>{day.date}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-4 text-[10px] font-bold text-text-secondary">
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Total Visits</div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed Consults</div>
                      </div>
                    </Card>
                  )}

                  {/* Widget 2: Doctor Utilization bar chart */}
                  {visibleWidgets.doctorLoad && (
                    <Card className="flex flex-col gap-6">
                      <div>
                        <h3 className="font-extrabold text-sm text-text-primary">Physician Workload Load</h3>
                        <p className="text-[10px] text-text-muted mt-0.5">Workload utilization across clinic doctors</p>
                      </div>

                      <div className="flex flex-col gap-4">
                        {doctors.map((doc, idx) => {
                          const percentage = idx === 0 ? 82 : idx === 1 ? 64 : 48;
                          return (
                            <div key={doc.id} className="flex flex-col gap-1.5 text-xs font-semibold text-text-secondary">
                              <div className="flex justify-between items-center">
                                <span className="font-bold">{doc.name}</span>
                                <span className="font-black text-text-primary">{percentage}% workload</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-bg-muted overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  )}

                  {/* Widget 3: Demographics side by side */}
                  {visibleWidgets.demographics && (
                    <Card className="flex flex-col gap-5">
                      <div>
                        <h3 className="font-extrabold text-sm text-text-primary">Patient Demographics</h3>
                        <p className="text-[10px] text-text-muted mt-0.5">Demographics distribution split by gender & age</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-semibold text-text-secondary mt-1">
                        <div className="flex flex-col gap-3">
                          <span className="text-[10px] font-black uppercase text-text-muted tracking-wider">Gender Split</span>
                          {analyticsData.demographics.gender.map((g, idx: number) => (
                            <div key={idx} className="flex justify-between items-center border-b border-border-subtle/30 pb-2">
                              <span>{g.label}</span>
                              <span className="font-black text-text-primary">{g.value}%</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col gap-3 border-l border-border-subtle/50 pl-6">
                          <span className="text-[10px] font-black uppercase text-text-muted tracking-wider">Age Bracket</span>
                          {analyticsData.demographics.age.map((a, idx: number) => (
                            <div key={idx} className="flex justify-between items-center border-b border-border-subtle/30 pb-2">
                              <span>{a.label}</span>
                              <span className="font-black text-text-primary">{a.value}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Widget 4: Visit Reasons breakdown */}
                  {visibleWidgets.reasons && (
                    <Card className="flex flex-col gap-6">
                      <div>
                        <h3 className="font-extrabold text-sm text-text-primary">Visit Reasons</h3>
                        <p className="text-[10px] text-text-muted mt-0.5">Reason for check-in distribution volume</p>
                      </div>

                      <div className="flex flex-col gap-3 text-xs font-semibold text-text-secondary">
                        {analyticsData.reasons.map((r, idx: number) => (
                          <div key={idx} className="flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                              <span>{r.label}</span>
                              <span className="font-black text-text-primary">{r.value}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-bg-muted overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{ width: `${r.value}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Widget 5: Peak operating hours heatmap */}
                  {visibleWidgets.heatmap && (
                    <Card className="flex flex-col gap-5 lg:col-span-2">
                      <div>
                        <h3 className="font-extrabold text-sm text-text-primary">Lobby Hourly Surges</h3>
                        <p className="text-[10px] text-text-muted mt-0.5">Concentration of check-ins across operating slots</p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-8 gap-3 mt-1">
                        {analyticsData.hourlyDistribution.map((slot, idx: number) => {
                          const level = slot.count > 30 ? 'bg-primary text-white' : slot.count > 20 ? 'bg-primary/70 text-white' : slot.count > 10 ? 'bg-primary-glow/20 text-text-secondary' : 'bg-bg-muted text-text-muted';
                          return (
                            <div key={idx} className={`p-3 rounded-2xl flex flex-col justify-between items-center text-center gap-1.5 transition ${level}`}>
                              <span className="text-[9px] font-black">{slot.hour}</span>
                              <span className="text-xs font-black">{slot.count} pat</span>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  )}

                </div>

                {/* Dynamic Reports Compilation & Exporter Hub */}
                <Card className="flex flex-col gap-5 mt-4">
                  <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Operational Reports Center</h3>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center text-xs font-semibold text-text-secondary">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] uppercase text-text-muted">Report Type</span>
                        <select 
                          value={reportType}
                          onChange={(e) => setReportType(e.target.value)}
                          className="p-2.5 border border-border-subtle rounded-xl bg-bg-surface text-text-primary focus:outline-none"
                        >
                          <option value="CLINIC">General Clinic Summary</option>
                          <option value="DOCTOR">Physician Activity Log</option>
                          <option value="QUEUE">Queue Wait Time Trends</option>
                          <option value="PATIENT">Demographics & Patients Log</option>
                        </select>
                      </div>
                    </div>

                    <Button 
                      onClick={handleExportCSV}
                      variant="primary"
                      className="bg-primary hover:bg-primary-hover shadow-sm"
                      isLoading={exportLoading}
                    >
                      Export CSV Spreadsheet
                    </Button>
                  </div>
                </Card>
              </>
            )}

          </div>
        )}

        {/* TAB 9: SCHEDULES & HOLIDAYS */}
        {activeTab === 'clinic' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            {/* Column 1 & 2: Clinic operational hours */}
            <div className="lg:col-span-2">
              <Card className="flex flex-col gap-5">
                <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Weekly operational schedule</h3>
                
                <div className="flex flex-col gap-3.5 mt-1 text-xs font-semibold text-text-secondary">
                  {[
                    { day: 'Monday', hours: '09:00 AM - 05:00 PM', closed: false },
                    { day: 'Tuesday', hours: '09:00 AM - 05:00 PM', closed: false },
                    { day: 'Wednesday', hours: '09:00 AM - 05:00 PM', closed: false },
                    { day: 'Thursday', hours: '09:00 AM - 05:00 PM', closed: false },
                    { day: 'Friday', hours: '09:00 AM - 05:00 PM', closed: false },
                    { day: 'Saturday', hours: '09:00 AM - 01:00 PM', closed: false },
                    { day: 'Sunday', hours: 'Closed', closed: true },
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-border-subtle/30 pb-2.5 last:border-0 last:pb-0">
                      <span>{item.day}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-text-secondary font-bold">{item.hours}</span>
                        <Badge variant={item.closed ? 'primary' : 'success'} size="sm">
                          {item.closed ? 'Closed' : 'Open'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Column 3: Holidays calendar placeholders */}
            <div className="flex flex-col gap-6">
              <Card className="flex flex-col gap-4">
                <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Scheduled Clinic Holidays</h3>
                
                <div className="flex flex-col gap-3 text-xs font-semibold text-text-secondary leading-relaxed mt-1">
                  {[
                    { date: '2026-09-07', desc: 'Labor Day' },
                    { date: '2026-11-26', desc: 'Thanksgiving Day' },
                    { date: '2026-12-25', desc: 'Christmas Day' },
                  ].map((hol, idx) => (
                    <div key={idx} className="p-3.5 border border-border-subtle bg-bg-surface rounded-2xl flex justify-between items-center font-bold">
                      <div>
                        <div className="text-text-primary">{hol.desc}</div>
                        <span className="text-[10px] text-text-muted mt-0.5">{hol.date}</span>
                      </div>
                      <Badge variant="primary" size="sm">Holiday</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

          </div>
        )}

        {/* TAB 10: AI OPTIMIZATION */}
        {activeTab === 'ai' && (
          <div className="flex flex-col gap-8 animate-fadeIn">
            
            {/* Overview dashboard AI */}
            <Card className="flex flex-col gap-4">
              <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Co-Pilot AI Queue Engine optimization</h3>
              <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                Our predictive AI models automatically monitor hourly patients check-ins, consultation delay rates, and historical data patterns to optimize lobby wait time estimates.
              </p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-5 border border-border-subtle/85 bg-bg-surface flex gap-3.5">
                <span className="text-3xl shrink-0">🤖</span>
                <div className="flex flex-col gap-0.5 truncate text-xs font-semibold text-text-secondary leading-relaxed">
                  <span className="font-extrabold text-sm text-text-primary">Hourly patient load surge forecasts</span>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-1">Surge surge alert: 11:30 AM - 01:00 PM</p>
                  <p className="font-medium mt-1">AI model expects +45% load increase today due to backlogged bookings check-ins.</p>
                </div>
              </Card>

              <Card className="p-5 border border-border-subtle/85 bg-bg-surface flex gap-3.5">
                <span className="text-3xl shrink-0">📈</span>
                <div className="flex flex-col gap-0.5 truncate text-xs font-semibold text-text-secondary leading-relaxed">
                  <span className="font-extrabold text-sm text-text-primary">Dynamic consultation speed calibrations</span>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-1">Serving efficiency factor: +15%</p>
                  <p className="font-medium mt-1">Average doctor cycle holds at 9.8 mins (vs 12.0m configured standard baseline).</p>
                </div>
              </Card>
            </div>

          </div>
        )}

        {/* TAB 11: SAAS PLAN & BILLING */}
        {activeTab === 'subscription' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            {/* Left: plan detail */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <Card className="flex flex-col gap-5">
                <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Active SaaS Plan</h3>
                
                <div className="flex flex-col gap-4 mt-1 text-xs font-semibold text-text-secondary">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-black text-primary">Smart Clinic Pro Package</div>
                      <p className="text-[10px] text-text-muted mt-0.5">Enables voice synthesizers, waiting Displays, and AI telemetry</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-text-primary">$129.00 / mo</div>
                      <p className="text-[10px] text-text-muted mt-0.5">Next bill date: Aug 24, 2026</p>
                    </div>
                  </div>

                  <div className="p-4 bg-bg-muted/20 border border-border-subtle/80 rounded-xl flex justify-between items-center gap-4 text-xs mt-2">
                    <div>
                      <div className="font-extrabold text-text-primary">Need multi-branch support?</div>
                      <p className="text-[11px] text-text-secondary font-medium mt-0.5 font-semibold">Contact support reps to upgrade to custom enterprise domains.</p>
                    </div>
                    <Button
                      onClick={() => alert('Upgrade request sent to sales reps.')}
                      variant="primary"
                      size="sm"
                    >
                      Contact reps
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Recent invoice history list */}
              <Card className="flex flex-col gap-4">
                <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Invoice Billing History</h3>
                
                <div className="flex flex-col gap-3">
                  {[
                    { id: 'INV-0428', date: '2026-07-24', amt: '$129.00', status: 'PAID' },
                    { id: 'INV-0311', date: '2026-06-24', amt: '$129.00', status: 'PAID' },
                    { id: 'INV-0199', date: '2026-05-24', amt: '$129.00', status: 'PAID' },
                  ].map((inv) => (
                    <div key={inv.id} className="flex justify-between items-center text-xs p-3.5 rounded-xl border border-border-subtle bg-bg-muted/10 font-bold">
                      <div>
                        <div className="text-text-primary">{inv.id}</div>
                        <span className="text-[9px] text-text-muted mt-0.5">{inv.date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-text-primary">{inv.amt}</span>
                        <Badge variant="success" size="sm">{inv.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right: plan quotas */}
            <div className="flex flex-col gap-6">
              <Card className="flex flex-col gap-4">
                <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Quotas & Usage</h3>
                
                <div className="flex flex-col gap-4 text-xs font-semibold text-text-secondary mt-1">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span>Doctor Queues</span>
                      <span>2 / 10 Active</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '20%' }} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 border-t border-border-subtle/40 pt-3">
                    <div className="flex justify-between items-center">
                      <span>Staff Invites</span>
                      <span>3 / 15 Invited</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '20%' }} />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

          </div>
        )}

        {/* TAB 12: SUPER ADMIN CLINICS REVIEWS */}
        {activeTab === 'reviews' && profile?.role === 'SUPER_ADMIN' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            {/* Left list: Clinics seeking review */}
            <div className="flex flex-col gap-4">
              <h3 className="font-extrabold text-sm text-text-primary">Clinics Verification Queue ({reviewClinics.length})</h3>
              
              {reviewClinics.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border-subtle rounded-2xl bg-bg-surface text-text-muted text-xs">
                  No clinics in verification reviews queue.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {reviewClinics.map((rev) => {
                    const latestReq = rev.verificationRequests?.[0];
                    return (
                      <button
                        key={rev.id}
                        onClick={() => {
                          setSelectedReviewClinic(rev);
                          setReviewReason('');
                        }}
                        className={`w-full text-left p-4 rounded-2xl border transition flex flex-col gap-2 ${
                          selectedReviewClinic?.id === rev.id
                            ? 'border-primary bg-primary-glow/10 shadow-sm'
                            : 'border-border-subtle bg-bg-surface hover:bg-bg-muted/30'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full gap-2">
                          <span className="font-extrabold text-xs text-text-primary truncate">{rev.name}</span>
                          <Badge variant={rev.status === 'VERIFIED' ? 'success' : rev.status === 'PENDING' ? 'warning' : 'danger'} size="sm">
                            {rev.status}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                          Subdomain: {rev.subdomain}
                        </div>
                        {latestReq && (
                          <div className="text-[9px] text-text-secondary leading-normal border-t border-border-subtle/50 pt-1.5 mt-0.5 font-medium truncate">
                            Request status: {latestReq.status}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Selected Clinic Detail review panel */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {selectedReviewClinic ? (
                <Card className="flex flex-col gap-6">
                  <div className="flex justify-between items-center border-b border-border-subtle/50 pb-4">
                    <div>
                      <span className="text-[10px] text-text-muted font-bold uppercase">Application Verification Review</span>
                      <h2 className="text-lg font-black text-text-primary mt-1">{selectedReviewClinic.name}</h2>
                    </div>
                    <Badge variant={selectedReviewClinic.status === 'VERIFIED' ? 'success' : 'primary'}>
                      {selectedReviewClinic.status}
                    </Badge>
                  </div>

                  {/* Section: Basic Profile */}
                  <div className="flex flex-col gap-2.5 text-xs text-text-secondary">
                    <span className="font-black text-[10px] uppercase text-text-muted tracking-widest border-b border-border-subtle/30 pb-1.5">Clinic Profile details</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-semibold mt-1">
                      <div>
                        <span className="text-text-muted">Legal Name:</span> {selectedReviewClinic.profile?.legalBusinessName || 'N/A'}
                      </div>
                      <div>
                        <span className="text-text-muted">Type:</span> {selectedReviewClinic.profile?.clinicType || 'N/A'}
                      </div>
                      <div>
                        <span className="text-text-muted">Primary Phone:</span> {selectedReviewClinic.phone}
                      </div>
                      <div>
                        <span className="text-text-muted">Primary Email:</span> {selectedReviewClinic.email}
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <span className="text-text-muted">Street Address:</span> {selectedReviewClinic.address}, {selectedReviewClinic.city}, {selectedReviewClinic.state} ({selectedReviewClinic.pincode})
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <span className="text-text-muted">Google Maps:</span> <a href={selectedReviewClinic.profile?.googleMapsUrl} target="_blank" className="text-primary hover:underline">{selectedReviewClinic.profile?.googleMapsUrl || 'N/A'}</a>
                      </div>
                    </div>
                  </div>

                  {/* Section: Doctors */}
                  <div className="flex flex-col gap-3">
                    <span className="font-black text-[10px] uppercase text-text-muted tracking-widest border-b border-border-subtle/30 pb-1.5">Registered Doctors ({selectedReviewClinic.doctors?.length || 0})</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                      {selectedReviewClinic.doctors?.map((doc) => (
                        <div key={doc.id} className="p-3 rounded-xl border border-border-subtle bg-bg-muted/10 text-xs font-bold">
                          <div className="text-text-primary">{doc.name}</div>
                          <div className="text-[10px] text-text-muted mt-0.5">{doc.specialization} • License Reg: {doc.registrationNumber || 'N/A'}</div>
                          <div className="text-[10px] text-text-secondary mt-1">Consultation Fee: ${doc.consultationFee || '50'}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section: Documents */}
                  <div className="flex flex-col gap-3">
                    <span className="font-black text-[10px] uppercase text-text-muted tracking-widest border-b border-border-subtle/30 pb-1.5">Uploaded Certificates & Licenses ({selectedReviewClinic.documents?.length || 0})</span>
                    <div className="flex flex-col gap-2 mt-1">
                      {selectedReviewClinic.documents?.map((doc) => (
                        <div key={doc.id} className="p-3.5 rounded-2xl border border-border-subtle bg-bg-muted/10 flex justify-between items-center text-xs font-bold">
                          <div>
                            <div className="text-text-primary">{doc.fileName}</div>
                            <span className="text-[9px] text-text-muted uppercase tracking-wider font-bold mt-0.5">{doc.documentType.replace('_', ' ')}</span>
                          </div>
                          <a href={doc.fileUrl} target="_blank">
                            <Button variant="outline" size="sm" className="text-[10px] px-3.5 py-1.5 h-[32px] font-black uppercase tracking-wider">
                              View File
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Decisions panel */}
                  <div className="border-t border-border-subtle/60 pt-5 flex flex-col gap-4 bg-bg-muted/10 p-5 rounded-2xl border border-border-subtle">
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">Verification Decision Controls</span>
                    
                    <Input
                      label="Reviewer Notes / Rejection Reason"
                      placeholder="Input notes or specify reasons if rejecting the clinic application..."
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                    />

                    <div className="flex gap-3 mt-2">
                      <Button
                        onClick={async () => {
                          setReviewLoading(true);
                          try {
                            const res = await fetch('/api/onboarding/review', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                clinicId: selectedReviewClinic.id,
                                action: 'APPROVE',
                                adminId: profile?.userId || 'unknown',
                                notes: reviewReason || 'Clinic application approved'
                              })
                            });
                            if (res.ok) {
                              alert('Clinic application successfully approved!');
                              setSelectedReviewClinic(null);
                              fetchReviewClinics();
                            }
                          } catch {
                            alert('Approval failed.');
                          } finally {
                            setReviewLoading(false);
                          }
                        }}
                        isLoading={reviewLoading}
                        variant="success"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg border-0 text-white shadow"
                      >
                        Approve Clinic
                      </Button>
                      
                      <Button
                        onClick={async () => {
                          if (!reviewReason.trim()) {
                            alert('Please specify a rejection reason in the input box above.');
                            return;
                          }
                          setReviewLoading(true);
                          try {
                            const res = await fetch('/api/onboarding/review', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                clinicId: selectedReviewClinic.id,
                                action: 'REJECT',
                                adminId: profile?.userId || 'unknown',
                                reason: reviewReason,
                                notes: 'Application rejected due to documentation issue'
                              })
                            });
                            if (res.ok) {
                              alert('Clinic application rejected.');
                              setSelectedReviewClinic(null);
                              fetchReviewClinics();
                            }
                          } catch {
                            alert('Rejection failed.');
                          } finally {
                            setReviewLoading(false);
                          }
                        }}
                        isLoading={reviewLoading}
                        variant="danger"
                        className="flex-1"
                      >
                        Reject & Send Feedback
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="border border-dashed border-border-subtle rounded-2xl p-20 text-center flex flex-col items-center justify-center bg-bg-surface/50">
                  <span className="text-5xl filter opacity-80 mb-4 select-none">🔍</span>
                  <h3 className="text-base font-bold text-text-primary">Awaiting Clinic Selection</h3>
                  <p className="text-xs text-text-muted mt-1 max-w-xs leading-relaxed font-semibold">
                    Select a clinic from the list on the left to verify license certificates and run approval actions.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
    </RoleGuard>
  );
}
