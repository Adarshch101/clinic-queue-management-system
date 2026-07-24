'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { usePathname } from 'next/navigation';
import { 
  Bell, 
  Sun, 
  Moon, 
  Building, 
  User, 
  ShieldAlert, 
  LogOut,
  ChevronDown,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';

export const Header: React.FC = () => {
  const {
    clinics,
    currentClinic,
    setClinicById,
    currentRole,
    setCurrentRole,
    currentUser,
    setCurrentUserById,
    notifications,
    theme,
    toggleTheme,
  } = useApp();

  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  const [clinicMenuOpen, setClinicMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const handleRoleChange = (role: 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN') => {
    setCurrentRole(role);
    setRoleMenuOpen(false);
    // Adjust mock user ID based on role
    if (role === 'PATIENT') {
      setCurrentUserById('pat-1');
    } else if (role === 'RECEPTIONIST') {
      setCurrentUserById('receptionist');
    } else if (role === 'DOCTOR') {
      setCurrentUserById('doc-1');
    } else if (role === 'ADMIN') {
      setCurrentUserById('admin');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Logo and branding */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl p-1.5 rounded-xl bg-indigo-600 text-white font-bold leading-none shadow-md shadow-indigo-500/20">
              Q
            </span>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-500 bg-clip-text text-transparent">
              Q-Clinix
            </span>
          </Link>
          
          <span className="hidden sm:flex text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 items-center gap-1 shadow-sm">
            <Sparkles className="w-3 h-3 animate-pulse" />
            SaaS Ready
          </span>
        </div>

        {/* MIDDLE SECTION: Navigation Links for Landing Page */}
        {isLandingPage ? (
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-500 dark:text-slate-350">
            <a href="#features" className="hover:text-indigo-600 transition">Features</a>
            <a href="#pricing" className="hover:text-indigo-600 transition">Pricing</a>
            <a href="#contact" className="hover:text-indigo-600 transition">Contact</a>
          </nav>
        ) : null}

        {/* RIGHT SECTION: Dynamic Actions */}
        <div className="flex items-center gap-3 md:gap-4">
          
          {isLandingPage ? (
            // --- visitor Mode Buttons ---
            <>
              {/* Quick Sandbox Bypass shortcut for testing */}
              <div className="relative">
                <button
                  onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100/50 transition"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Sandbox Views
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {roleMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-1.5 ring-1 ring-black/5 animate-slide-up">
                    <div className="px-3 py-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Quick Launch
                    </div>
                    {[
                      { r: 'PATIENT', path: '/patient/dashboard', label: 'Patient Dashboard' },
                      { r: 'RECEPTIONIST', path: '/receptionist/dashboard', label: 'Reception Dashboard' },
                      { r: 'DOCTOR', path: '/doctor/dashboard', label: 'Doctor Suite' },
                      { r: 'ADMIN', path: '/admin/dashboard', label: 'Clinic Admin' },
                    ].map((roleObj) => (
                      <Link
                        key={roleObj.r}
                        href={roleObj.path}
                        onClick={() => handleRoleChange(roleObj.r as any)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/80 block"
                      >
                        {roleObj.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Login Link */}
              <Link
                href="/login"
                className="text-xs font-bold text-gray-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Log In
              </Link>

              {/* Register Link */}
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition flex items-center gap-1"
              >
                Register Clinic <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          ) : (
            // --- Authenticated Dashboard Mode ---
            <>
              {/* Clinic Switcher */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setClinicMenuOpen(!clinicMenuOpen);
                    setRoleMenuOpen(false);
                    setNotifMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-850 transition"
                  id="clinic-selector-btn"
                >
                  <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden sm:inline truncate max-w-[120px]">{currentClinic.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>
                
                {clinicMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-1.5 ring-1 ring-black/5 animate-slide-up">
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                      Select Active Clinic (Tenant)
                    </div>
                    {clinics.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setClinicById(c.id);
                          setClinicMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 ${currentClinic.id === c.id ? 'bg-indigo-50/50 dark:bg-slate-800 font-semibold text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-slate-350'}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">{c.logo}</span>
                          <span>{c.name}</span>
                        </span>
                        {currentClinic.id === c.id && <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Simulation Role Selector */}
              <div className="relative">
                <button
                  onClick={() => {
                    setRoleMenuOpen(!roleMenuOpen);
                    setClinicMenuOpen(false);
                    setNotifMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95 transition"
                  id="role-simulator-btn"
                >
                  <span className="text-xs uppercase opacity-80">Role:</span>
                  <span className="capitalize">{currentRole.toLowerCase()}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {roleMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-1.5 ring-1 ring-black/5 animate-slide-up">
                    <div className="px-3 py-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Simulation Controls
                    </div>
                    {(['PATIENT', 'RECEPTIONIST', 'DOCTOR', 'ADMIN'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRoleChange(r)}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 ${currentRole === r ? 'bg-indigo-50/50 dark:bg-indigo-950/20 font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-slate-350'}`}
                      >
                        <span>{r === 'PATIENT' ? 'Patient Dashboard' : r === 'RECEPTIONIST' ? 'Reception Dashboard' : r === 'DOCTOR' ? 'Doctor Dashboard' : 'Clinic Admin'}</span>
                        {currentRole === r && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 dark:border-slate-800 my-1"></div>
                    <Link
                      href="/tv-display"
                      target="_blank"
                      className="w-full text-left px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-between"
                      onClick={() => setRoleMenuOpen(false)}
                    >
                      <span>Waiting Room TV Mode</span>
                      <span className="text-[10px] uppercase font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                        TV Open
                      </span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Real-time Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifMenuOpen(!notifMenuOpen);
                    setClinicMenuOpen(false);
                    setRoleMenuOpen(false);
                  }}
                  className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200 transition relative"
                  id="notifications-btn"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce shadow-sm">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                {notifMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-1.5 ring-1 ring-black/5 animate-slide-up max-h-[380px] overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-bold text-sm text-gray-800 dark:text-slate-100">Live Notifications</span>
                      <span className="text-xs text-gray-400">{notifications.length} total</span>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 text-xs">No active notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="px-4 py-3 border-b border-gray-50 dark:border-slate-850 hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition">
                          <div className="flex gap-2">
                            {n.title.toLowerCase().includes('confirmed') || n.title.toLowerCase().includes('complete') ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="text-xs font-semibold text-gray-800 dark:text-slate-200">{n.title}</div>
                              <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{n.body}</div>
                              <div className="flex items-center gap-1.5 mt-1 text-[9px] font-medium text-gray-400">
                                <span>{n.time}</span>
                                <span>•</span>
                                <span className="text-indigo-500">{n.channel}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-2 border-l border-gray-200 dark:border-slate-800 pl-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-sm font-semibold overflow-hidden shadow-sm shadow-indigo-500/10">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser?.name.charAt(0) || <User className="w-4 h-4" />
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-gray-800 dark:text-slate-200 truncate max-w-[100px]">{currentUser?.name}</div>
                  <div className="text-[10px] text-gray-400 dark:text-slate-500 capitalize">{currentRole.toLowerCase()}</div>
                </div>
              </div>
            </>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            id="theme-toggle-btn"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-400" />}
          </button>

        </div>
      </div>
    </header>
  );
};
export default Header;
