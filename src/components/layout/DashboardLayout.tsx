'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context/AuthContext';
import { 
  Menu, X, Sun, Moon, Bell, 
  Home, Activity, FileText, History, Calendar, 
  UserCheck, Users, Settings, BarChart3, 
  Sparkles, CreditCard, ChevronDown, LogOut,
  Building, Shield, Trash2, LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const {
    clinics,
    currentClinic,
    setClinicById,
    currentRole,
    currentUser,
    notifications,
    theme,
    toggleTheme,
    markNotifAsRead,
    markAllNotifsAsRead,
    deleteNotif
  } = useApp();

  const { profile, logout } = useAuth();

  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clinicMenuOpen, setClinicMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [prefModalOpen, setPrefModalOpen] = useState(false);

  // Preferences State
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [browserEnabled, setBrowserEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const [prefTimeFormat, setPrefTimeFormat] = useState('12h');
  const [prefDateFormat, setPrefDateFormat] = useState('MM/DD/YYYY');
  const [prefAccessibility, setPrefAccessibility] = useState(false);
  const [prefLoading, setPrefLoading] = useState(false);

  // Fetch preferences on open
  useEffect(() => {
    if (prefModalOpen && currentUser?.id) {
      // 1. Fetch Notification Preferences
      fetch(`/api/notifications/preferences?userId=${currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setEmailEnabled(data.emailEnabled);
            setSmsEnabled(data.smsEnabled);
            setWhatsappEnabled(data.whatsappEnabled);
            setBrowserEnabled(data.browserEnabled);
            setPushEnabled(data.pushEnabled);
            setQuietHoursStart(data.quietHoursStart || '22:00');
            setQuietHoursEnd(data.quietHoursEnd || '08:00');
          }
        })
        .catch(err => console.error(err));

      // 2. Fetch User Personalization Preferences
      fetch(`/api/user/preferences?userId=${currentUser.id}`)
        .then(res => res.json())
        .then(resData => {
          const data = resData.data;
          if (data) {
            setPrefTimeFormat(data.timeFormat || '12h');
            setPrefDateFormat(data.dateFormat || 'MM/DD/YYYY');
            setPrefAccessibility(data.accessibility || false);
          }
        })
        .catch(err => console.error(err));
    }
  }, [prefModalOpen, currentUser?.id]);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setPrefLoading(true);
    try {
      // 1. Save Notification Preferences
      await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          emailEnabled,
          smsEnabled,
          whatsappEnabled,
          browserEnabled,
          pushEnabled,
          quietHoursStart,
          quietHoursEnd
        })
      });

      // 2. Save User Personalization Preferences
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          theme,
          language: 'en',
          timeFormat: prefTimeFormat,
          dateFormat: prefDateFormat,
          accessibility: prefAccessibility
        })
      });

      alert('User preferences saved successfully!');
      setPrefModalOpen(false);
    } catch {
      alert('Failed to save preferences.');
    } finally {
      setPrefLoading(false);
    }
  };

  const unreadNotifs = notifications.filter(n => !n.isRead).length;



  // Resolve sidebar links based on role
  const getSidebarLinks = () => {
    switch (currentRole) {
      case 'PATIENT':
        return [
          { href: '/patient/dashboard', label: 'Patient Dashboard', icon: <Home className="w-4 h-4" /> },
          { href: '/queue-status', label: 'Live Queue status', icon: <Activity className="w-4 h-4" /> },
          { href: '/patient/dashboard#reports', label: 'Medical Reports', icon: <FileText className="w-4 h-4" /> },
          { href: '/patient/dashboard#visits', label: 'Visit History', icon: <History className="w-4 h-4" /> },
        ];
      case 'RECEPTIONIST':
        return [
          { href: '/receptionist/dashboard', label: 'Reception Dashboard', icon: <Home className="w-4 h-4" /> },
          { href: '/receptionist/dashboard#register', label: 'Register Walk-In', icon: <Users className="w-4 h-4" /> },
          { href: '/receptionist/dashboard#bookings', label: 'Booked Appointments', icon: <Calendar className="w-4 h-4" /> },
          { href: '/receptionist/dashboard#waitlist', label: 'Live Wait List', icon: <Activity className="w-4 h-4" /> },
        ];
      case 'DOCTOR':
        return [
          { href: '/doctor/dashboard', label: 'Doctor Suite', icon: <Home className="w-4 h-4" /> },
          { href: '/doctor/dashboard#consultation', label: 'Consultation Room', icon: <UserCheck className="w-4 h-4" /> },
          { href: '/doctor/dashboard#queue', label: 'Upcoming Patients', icon: <Activity className="w-4 h-4" /> },
          { href: '/doctor/dashboard#history', label: 'Consultation Logs', icon: <History className="w-4 h-4" /> },
        ];
      case 'SUPER_ADMIN':
        return [
          { href: '/admin/super-dashboard', label: 'Super Admin Suite', icon: <Shield className="w-4 h-4 text-rose-500" /> },
          { href: '/admin/super-dashboard#clinics', label: 'Tenant Management', icon: <Building className="w-4 h-4" /> },
          { href: '/admin/super-dashboard#reviews', label: 'Verification Reviews', icon: <Sparkles className="w-4 h-4" /> },
          { href: '/admin/super-dashboard#flags', label: 'Platform Flags', icon: <Settings className="w-4 h-4" /> },
          { href: '/admin/super-dashboard#audits', label: 'Security Audits', icon: <History className="w-4 h-4" /> },
          { href: '/admin/dashboard', label: 'Clinic Admin Panel', icon: <BarChart3 className="w-4 h-4" /> },
        ];
      case 'ADMIN':
        const adminLinks = [
          { href: '/admin/dashboard', label: 'Analytics Panel', icon: <BarChart3 className="w-4 h-4" /> },
          { href: '/admin/dashboard#staff', label: 'Staff Management', icon: <Users className="w-4 h-4" /> },
          { href: '/admin/dashboard#schedules', label: 'Weekly Hours', icon: <Calendar className="w-4 h-4" /> },
          { href: '/admin/dashboard#profile', label: 'Clinic Profile', icon: <Building className="w-4 h-4" /> },
          { href: '/admin/dashboard#subscription', label: 'Plan & Billing', icon: <CreditCard className="w-4 h-4" /> },
        ];
        if (profile?.role === 'SUPER_ADMIN') {
          adminLinks.unshift({ href: '/admin/super-dashboard', label: 'Super Admin Suite', icon: <Shield className="w-4 h-4 text-rose-500" /> });
        }
        return adminLinks;
      default:
        return [];
    }
  };

  const navLinks = getSidebarLinks();

  return (
    <div className="flex min-h-screen bg-bg-base text-text-primary">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border-subtle bg-bg-surface flex flex-col justify-between transition-transform duration-350 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 shrink-0`}
      >
        <div className="flex flex-col gap-6 p-5">
          {/* Sidebar Header Brand */}
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl px-2.5 py-1 rounded-xl bg-primary text-white font-black leading-none shadow shadow-primary/20">
                Q
              </span>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                Q-Clinix
              </span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-xl hover:bg-bg-muted text-text-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Collapsible tenant workspace selector */}
          <div className="relative">
            <button 
              onClick={() => setClinicMenuOpen(!clinicMenuOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-border-subtle hover:bg-bg-muted/40 transition text-left"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-base shrink-0">{currentClinic?.logo || '🏥'}</span>
                <span className="font-bold text-xs truncate">{currentClinic?.name || 'Select Clinic'}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
            </button>

            {clinicMenuOpen && (
              <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-border-subtle bg-bg-surface shadow-lg py-1.5 animate-slide-up">
                {clinics.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setClinicById(c.id);
                      setClinicMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-bg-muted ${
                      currentClinic?.id === c.id ? 'font-bold text-primary bg-primary-glow' : 'text-text-secondary'
                    }`}
                  >
                    <span>{c.name}</span>
                    {currentClinic?.id === c.id && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links list */}
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    active 
                      ? 'bg-primary text-white shadow shadow-primary/10' 
                      : 'text-text-secondary hover:bg-bg-muted hover:text-text-primary'
                  }`}
                >
                  <span className="shrink-0">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar user profile info */}
        <div className="p-5 border-t border-border-subtle/60 flex items-center justify-between gap-3 bg-bg-muted/10">
          <div 
            onClick={() => setPrefModalOpen(true)}
            className="flex items-center gap-2 truncate cursor-pointer hover:bg-bg-muted/30 p-1.5 rounded-xl transition"
            title="Notification Preferences"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-indigo-400 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {currentUser?.name.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-extrabold text-text-primary truncate">{currentUser?.name}</div>
              <div className="text-[9px] uppercase font-black text-text-muted tracking-wider">{currentRole.toLowerCase()}</div>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="p-1.5 text-text-secondary hover:text-danger rounded-lg hover:bg-danger-muted transition cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MAIN SCREEN BODY (Right Side) */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Sticky Dashboard Header */}
        <header className="sticky top-0 z-30 w-full border-b border-border-subtle bg-bg-surface/75 backdrop-blur-md h-16 flex items-center justify-between px-6 gap-4">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-bg-muted text-text-secondary shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Role Dashboard Header Link */}
            {profile?.role && (
              <Link
                href={
                  profile.role === 'SUPER_ADMIN' ? '/admin/super-dashboard' :
                  profile.role === 'ADMIN' ? '/admin/dashboard' :
                  profile.role === 'DOCTOR' ? '/doctor/dashboard' :
                  profile.role === 'RECEPTIONIST' ? '/receptionist/dashboard' :
                  '/patient/dashboard'
                }
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-black hover:bg-primary/20 transition"
                title="Active Role Dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>
                  {profile.role === 'SUPER_ADMIN' ? 'Super Admin Dashboard' :
                   profile.role === 'ADMIN' ? 'Clinic Admin Dashboard' :
                   profile.role === 'DOCTOR' ? 'Doctor Dashboard' :
                   profile.role === 'RECEPTIONIST' ? 'Receptionist Dashboard' :
                   'Patient Dashboard'}
                </span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                className="p-2 rounded-xl text-text-secondary hover:bg-bg-muted transition relative"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-danger text-white text-[9px] font-black flex items-center justify-center shadow animate-pulse">
                    {unreadNotifs}
                  </span>
                )}
              </button>

               {notifMenuOpen && (
                 <div className="absolute right-0 mt-2 w-80 z-50 rounded-xl border border-border-subtle bg-bg-surface shadow-lg py-1.5 max-h-80 overflow-y-auto animate-slide-up">
                   <div className="px-4 py-2 border-b border-border-subtle flex justify-between items-center text-xs font-bold">
                     <span>Notifications</span>
                     {unreadNotifs > 0 && (
                       <button 
                         onClick={() => markAllNotifsAsRead()}
                         className="text-[9px] text-primary hover:underline font-extrabold uppercase"
                       >
                         Mark all read
                       </button>
                     )}
                   </div>
                   {notifications.length === 0 ? (
                     <div className="py-8 text-center text-xs text-text-muted">No notifications</div>
                   ) : (
                     notifications.map((n) => (
                       <div 
                         key={n.id} 
                         className={`px-4 py-3 border-b border-border-subtle/50 transition text-xs flex justify-between gap-3 ${
                           n.isRead ? 'opacity-70 bg-bg-surface' : 'bg-primary-glow/5 font-bold'
                         }`}
                       >
                         <div className="flex-1 min-w-0">
                           <div className="font-semibold text-text-primary truncate">{n.title}</div>
                           <div className="text-[11px] text-text-secondary mt-0.5 leading-normal">{n.body}</div>
                           <div className="text-[9px] text-text-muted mt-1 uppercase tracking-wider">{n.time}</div>
                         </div>
                         
                         <div className="flex flex-col gap-1.5 shrink-0 items-end">
                           {!n.isRead && (
                             <button 
                               onClick={() => markNotifAsRead(n.id)} 
                               className="text-[9px] text-primary hover:underline font-bold"
                               title="Mark as read"
                             >
                               Mark Read
                             </button>
                           )}
                           <button 
                             onClick={() => deleteNotif(n.id)} 
                             className="text-text-muted hover:text-danger p-0.5 rounded transition"
                             title="Delete"
                           >
                             <Trash2 className="w-3.5 h-3.5" />
                           </button>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-text-secondary hover:bg-bg-muted transition shrink-0"
            >
              {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5 text-yellow-400" />}
            </button>
          </div>
        </header>

        {/* Content Box */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto w-full">
          {children}
        </main>
      </div>

      {/* Profile & Notification Preferences Overlay Modal */}
      {prefModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-bg-surface border border-border-subtle shadow-2xl rounded-3xl p-6 flex flex-col gap-5 animate-slide-up">
            <div className="flex justify-between items-center border-b border-border-subtle pb-3">
              <h3 className="font-extrabold text-sm text-text-primary">Communication Preferences</h3>
              <button 
                onClick={() => setPrefModalOpen(false)}
                className="text-text-muted hover:text-text-primary text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePreferences} className="flex flex-col gap-4 text-xs font-semibold text-text-secondary leading-normal">
              
              {/* Channel preference checkboxes */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase text-text-muted tracking-widest border-b border-border-subtle/50 pb-1">Enabled Channels</span>
                
                {[
                  { label: 'Email Notifications', val: emailEnabled, set: setEmailEnabled, desc: 'Receive queue slip vouchers and invoices' },
                  { label: 'Browser Alerts', val: browserEnabled, set: setBrowserEnabled, desc: 'Show toast alerts during consultation queues' },
                  { label: 'SMS Messages', val: smsEnabled, set: setSmsEnabled, desc: 'Text messages for live queue calling (pluggable Twilio)' },
                  { label: 'WhatsApp Updates', val: whatsappEnabled, set: setWhatsappEnabled, desc: 'WhatsApp live alerts (pluggable WhatsApp API)' },
                  { label: 'Push Notifications', val: pushEnabled, set: setPushEnabled, desc: 'FCM push notifications (mobile stubs)' },
                ].map((item, idx) => (
                  <label key={idx} className="flex items-start gap-3 cursor-pointer select-none py-1">
                    <input 
                      type="checkbox" 
                      checked={item.val} 
                      onChange={(e) => item.set(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary shrink-0"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-text-primary font-bold">{item.label}</span>
                      <span className="text-[10px] text-text-muted">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Quiet hours configuration */}
              <div className="flex flex-col gap-3 mt-1">
                <span className="text-[10px] font-black uppercase text-text-muted tracking-widest border-b border-border-subtle/50 pb-1">Quiet Hours Settings</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-text-muted">Start Hours</span>
                    <input 
                      type="time" 
                      value={quietHoursStart} 
                      onChange={(e) => setQuietHoursStart(e.target.value)}
                      className="p-2.5 rounded-xl border border-border-subtle bg-bg-surface text-text-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-text-muted">End Hours</span>
                    <input 
                      type="time" 
                      value={quietHoursEnd} 
                      onChange={(e) => setQuietHoursEnd(e.target.value)}
                      className="p-2.5 rounded-xl border border-border-subtle bg-bg-surface text-text-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Localization & Formatting Preferences */}
              <div className="flex flex-col gap-3 mt-1">
                <span className="text-[10px] font-black uppercase text-text-muted tracking-widest border-b border-border-subtle/50 pb-1">Localization & Formats</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-text-muted">Time Format</span>
                    <select 
                      value={prefTimeFormat} 
                      onChange={(e) => setPrefTimeFormat(e.target.value)}
                      className="p-2.5 rounded-xl border border-border-subtle bg-bg-surface text-text-primary focus:outline-none"
                    >
                      <option value="12h">12-hour (AM/PM)</option>
                      <option value="24h">24-hour</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-text-muted">Date Format</span>
                    <select 
                      value={prefDateFormat} 
                      onChange={(e) => setPrefDateFormat(e.target.value)}
                      className="p-2.5 rounded-xl border border-border-subtle bg-bg-surface text-text-primary focus:outline-none"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input 
                    type="checkbox" 
                    checked={prefAccessibility} 
                    onChange={(e) => setPrefAccessibility(e.target.checked)}
                    className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-bold text-text-primary">Enable High Contrast Accessibility</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 border-t border-border-subtle pt-4 mt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPrefModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="sm"
                  className="bg-primary"
                  isLoading={prefLoading}
                >
                  Save Preferences
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default DashboardLayout;
