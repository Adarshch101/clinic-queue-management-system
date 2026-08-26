'use client';

import React from 'react';
import { Card, StatsCard } from '@/components/ui/Card';
import { Users, Activity, UserCheck, Clock, UserPlus, Pause, Play, Calendar, Building, FileText } from 'lucide-react';
import type { Doctor, QueueToken } from '@/lib/mockData';

interface AdminActivityLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
}

interface AdminDashboardStats {
  recentActivity?: AdminActivityLog[];
}

interface OverviewTabProps {
  profile: { name?: string; role?: string } | null;
  queueTokens: QueueToken[];
  doctors: Doctor[];
  waitingCount: number;
  completedConsultations: number;
  loadingStats: boolean;
  dashboardStats: AdminDashboardStats | null;
  setActiveTab: (tab: string) => void;
  pauseQueue: (doctorId: string) => Promise<void> | void;
  resumeQueue: (doctorId: string) => Promise<void> | void;
}

export function OverviewTab({
  profile,
  queueTokens,
  doctors,
  waitingCount,
  completedConsultations,
  loadingStats,
  dashboardStats,
  setActiveTab,
  pauseQueue,
  resumeQueue,
}: OverviewTabProps) {
  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* Welcome banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-tr from-primary to-indigo-700 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow shadow-primary/10">
        <div>
          <h2 className="text-xl font-black">Welcome Back, {profile?.name || 'Administrator'}</h2>
          <p className="text-xs text-indigo-100 font-semibold mt-1">
            Operational Command console is online. Today is{' '}
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
          </p>
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
            <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">
              Operational Quick Actions
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-1">
              {[
                { label: 'Register Walk-In', link: 'queue', icon: <UserPlus className="w-4 h-4 text-emerald-500 shrink-0" /> },
                { label: 'Pause Lobby Queue', action: () => pauseQueue(doctors[0]?.id || ''), icon: <Pause className="w-4 h-4 text-amber-500 shrink-0" /> },
                { label: 'Resume Lobby Queue', action: () => resumeQueue(doctors[0]?.id || ''), icon: <Play className="w-4 h-4 text-emerald-500 shrink-0" /> },
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
            <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">
              Duty Physicians waitlist overview
            </h3>

            <div className="flex flex-col gap-3 mt-1">
              {doctors.map((doc) => {
                const docQueue = queueTokens.filter((t) => t.doctorId === doc.id && t.status === 'WAITING');
                const docServing = queueTokens.find(
                  (t) => t.doctorId === doc.id && (t.status === 'CALLED' || t.status === 'IN_CONSULTATION')
                );
                return (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-2xl border border-border-subtle bg-bg-surface flex items-center justify-between gap-4 text-xs font-bold"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🩺</span>
                      <div>
                        <div className="text-text-primary">{doc.name}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          {doc.specialization} • Room {doc.roomNumber}
                        </div>
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
              <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">
                Recent Security Activity logs
              </h3>

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
  );
}
