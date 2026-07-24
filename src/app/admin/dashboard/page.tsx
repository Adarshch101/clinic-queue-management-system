'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/dashboard/Header';
import { 
  Building, 
  Users, 
  Calendar, 
  BarChart3, 
  Bot, 
  CreditCard, 
  Settings, 
  Activity, 
  Clock, 
  UserCheck, 
  Sparkles,
  TrendingUp,
  BrainCircuit,
  Sliders,
  Plus,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const {
    clinics,
    doctors,
    patients,
    appointments,
    queueTokens,
    currentClinic,
    aiPredictions
  } = useApp();

  const [activeTab, setActiveTab] = useState<'analytics' | 'clinic' | 'ai' | 'subscription'>('analytics');

  // Working hours state mock
  const [workingHours, setWorkingHours] = useState([
    { day: 'Monday', hours: '09:00 AM - 05:00 PM', closed: false },
    { day: 'Tuesday', hours: '09:00 AM - 05:00 PM', closed: false },
    { day: 'Wednesday', hours: '09:00 AM - 05:00 PM', closed: false },
    { day: 'Thursday', hours: '09:00 AM - 05:00 PM', closed: false },
    { day: 'Friday', hours: '09:00 AM - 05:00 PM', closed: false },
    { day: 'Saturday', hours: '09:00 AM - 01:00 PM', closed: false },
    { day: 'Sunday', hours: 'Closed', closed: true },
  ]);

  // Holidays state mock
  const [holidays, setHolidays] = useState([
    { date: '2026-09-07', desc: 'Labor Day' },
    { date: '2026-11-26', desc: 'Thanksgiving Day' },
    { date: '2026-12-25', desc: 'Christmas Day' },
  ]);

  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayDesc, setNewHolidayDesc] = useState('');

  const addHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayDesc) return;
    setHolidays([...holidays, { date: newHolidayDate, desc: newHolidayDesc }]);
    setNewHolidayDate('');
    setNewHolidayDesc('');
  };

  // General clinic stats
  const totalPatients = patients.length;
  const totalAppointments = appointments.length;
  const completedConsultations = queueTokens.filter(t => t.status === 'COMPLETED').length;
  const walkInsCount = queueTokens.filter(t => !t.appointmentId).length;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Admin Title Banner */}
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight">Clinic Administrator Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Configure working calendars, review multi-clinic volume, and activate AI queue optimization rules.
          </p>
        </div>

        {/* Quick Analytics Summary Panel */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Patients Registered', val: totalPatients, change: '+12% this month', icon: <Users className="w-5 h-5 text-indigo-600" /> },
            { label: 'Consultations Completed', val: completedConsultations, change: '+4.5% vs yesterday', icon: <UserCheck className="w-5 h-5 text-emerald-600" /> },
            { label: 'Walk-In Patient Ratio', val: `${Math.round((walkInsCount / (queueTokens.length || 1)) * 100)}%`, change: '24% scheduled bookings', icon: <Activity className="w-5 h-5 text-indigo-600" /> },
            { label: 'Average Waiting Time', val: '14.2 min', change: '-2.1 mins wait drop', icon: <Clock className="w-5 h-5 text-amber-600" /> }
          ].map((stat, idx) => (
            <div key={idx} className="glass-panel p-5 border-gray-150 dark:border-slate-850 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">{stat.label}</div>
                <div className="text-2xl font-extrabold text-gray-800 dark:text-slate-100 mt-1">{stat.val}</div>
                <div className="text-[10px] text-emerald-500 font-semibold mt-1">{stat.change}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm">{stat.icon}</div>
            </div>
          ))}
        </div>

        {/* Tab Selection Row */}
        <div className="flex border-b border-gray-200 dark:border-slate-850 mb-8">
          {[
            { id: 'analytics', label: 'Interactive Analytics', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'clinic', label: 'Working Schedules & Calendars', icon: <Calendar className="w-4 h-4" /> },
            { id: 'ai', label: 'AI Optimization Console', icon: <BrainCircuit className="w-4 h-4" /> },
            { id: 'subscription', label: 'SaaS Plan & Billing', icon: <CreditCard className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${activeTab === tab.id ? 'border-blue-600 text-indigo-600 dark:border-sky-400 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Interactive Analytics */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Chart 1: SVG Wait Time Trends */}
            <div className="glass-panel p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-extrabold text-base text-gray-800 dark:text-slate-100">Average Waiting Time (7 Days)</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Average minutes patients spent in waiting hall.</p>
                </div>
                <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> -12% Improved
                </span>
              </div>
              
              <div className="h-60 flex items-end justify-between px-2 pt-6 relative border-b border-l border-gray-150 dark:border-slate-800">
                {/* Simulated Gridlines */}
                <div className="absolute left-0 right-0 border-t border-dashed border-gray-150 dark:border-slate-850/60 top-1/4" />
                <div className="absolute left-0 right-0 border-t border-dashed border-gray-150 dark:border-slate-850/60 top-2/4" />
                <div className="absolute left-0 right-0 border-t border-dashed border-gray-150 dark:border-slate-850/60 top-3/4" />

                {/* SVG Line representation overlay */}
                <svg className="absolute inset-0 w-full h-full p-2 overflow-visible" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3.5"
                    points="30,160 80,180 130,110 180,90 230,140 280,60 330,80"
                    className="drop-shadow-sm"
                  />
                  <circle cx="30" cy="160" r="5" fill="#2563eb" />
                  <circle cx="80" cy="180" r="5" fill="#2563eb" />
                  <circle cx="130" cy="110" r="5" fill="#2563eb" />
                  <circle cx="180" cy="90" r="5" fill="#2563eb" />
                  <circle cx="230" cy="140" r="5" fill="#2563eb" />
                  <circle cx="280" cy="60" r="5" fill="#2563eb" />
                  <circle cx="330" cy="80" r="5" fill="#2563eb" />
                </svg>

                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                  <span key={idx} className="text-[10px] text-gray-400 absolute mb-[-24px]" style={{ left: `${idx * 14.5 + 4}%` }}>
                    {day}
                  </span>
                ))}
              </div>
            </div>

            {/* Chart 2: SVG Peak Hours Load */}
            <div className="glass-panel p-6">
              <h3 className="font-extrabold text-base text-gray-800 dark:text-slate-100 mb-2">Hourly Consultation Load (Peak Hours)</h3>
              <p className="text-[10px] text-gray-400 mb-6">Patient volume concentration categorized by hourly timeframes.</p>

              <div className="h-60 flex items-end justify-between gap-3 pt-6 border-b border-l border-gray-150 dark:border-slate-800">
                {aiPredictions.peakHourForecast.map((hour, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-500 hover:brightness-115 ${hour.load > 80 ? 'bg-rose-500' : hour.load > 60 ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                      style={{ height: `${hour.load * 1.8}px` }}
                      title={`${hour.load}% load at ${hour.hour}`}
                    />
                    <span className="text-[9px] text-gray-400 truncate max-w-[32px]">{hour.hour}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-Metrics grid */}
            <div className="glass-panel p-6 lg:col-span-2">
              <h3 className="font-extrabold text-base text-gray-800 dark:text-slate-100 mb-4">Clinic Performance Audit Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="p-4 rounded-xl border border-gray-150 dark:border-slate-850">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Appointment vs Walk-in ratio</div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 h-3 rounded-full bg-slate-200 dark:bg-slate-850 overflow-hidden flex">
                      <div className="bg-indigo-600 h-full w-[70%]" title="Scheduled: 70%" />
                      <div className="bg-teal-500 h-full w-[30%]" title="Walk-ins: 30%" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 font-medium">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-600" /> Scheduled (70%)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-teal-500" /> Walk-In (30%)</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-150 dark:border-slate-850">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">No-Show / Cancel Ratios</div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 h-3 rounded-full bg-slate-200 dark:bg-slate-850 overflow-hidden flex">
                      <div className="bg-emerald-500 h-full w-[85%]" title="Attended: 85%" />
                      <div className="bg-rose-500 h-full w-[15%]" title="No-Shows: 15%" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 font-medium">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> Attended (85%)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500" /> No-Shows (15%)</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-150 dark:border-slate-850">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Clinic Queue speed rule</div>
                  <div className="flex items-center justify-between mt-3.5">
                    <span className="text-xs font-bold">Priority Buffer Offset</span>
                    <span className="text-xs px-2.5 py-0.5 font-bold rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">+5 mins</span>
                  </div>
                  <div className="text-[9px] text-gray-400 mt-2 font-medium">
                    Emergency patient routing puts emergencies automatically as index +1, updating wait offsets.
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Calendars & Schedules */}
        {activeTab === 'clinic' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Working hours configuration */}
            <div className="glass-panel p-6">
              <h3 className="font-extrabold text-base text-gray-800 dark:text-slate-100 mb-2">Weekly Clinic Hours</h3>
              <p className="text-[10px] text-gray-400 mb-6">Manage global operating hours for CareFirst Medical Center.</p>
              
              <div className="space-y-3.5">
                {workingHours.map((wh, index) => (
                  <div key={index} className="flex justify-between items-center text-xs p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-850">
                    <span className="font-bold text-gray-700 dark:text-slate-200">{wh.day}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${wh.closed ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-600'}`}>
                        {wh.hours}
                      </span>
                      <button 
                        onClick={() => alert(`Simulated edit: Hours for ${wh.day}`)}
                        className="text-[10px] font-bold text-indigo-500 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Holidays calendar */}
            <div className="glass-panel p-6">
              <h3 className="font-extrabold text-base text-gray-800 dark:text-slate-100 mb-2">Scheduled Clinic Holidays</h3>
              <p className="text-[10px] text-gray-400 mb-6">Schedule future closures or seasonal holidays. Patients will be blocked from booking.</p>
              
              <form onSubmit={addHoliday} className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-gray-150 dark:border-slate-850">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Holiday Date</label>
                  <input
                    type="date"
                    required
                    value={newHolidayDate}
                    onChange={(e) => setNewHolidayDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-250 dark:border-slate-850 bg-white dark:bg-[#060814] text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Holiday Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Labor Day"
                    value={newHolidayDesc}
                    onChange={(e) => setNewHolidayDesc(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-250 dark:border-slate-850 bg-white dark:bg-[#060814] text-xs focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="col-span-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs mt-2"
                >
                  Schedule Closure
                </button>
              </form>

              <div className="space-y-3">
                {holidays.map((h, index) => (
                  <div key={index} className="flex justify-between items-center text-xs p-2.5 rounded border border-gray-150 dark:border-slate-850">
                    <span className="font-semibold text-gray-800 dark:text-slate-250">{h.desc}</span>
                    <span className="text-[10px] text-gray-450 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{h.date}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: AI Console */}
        {activeTab === 'ai' && (
          <div className="space-y-8">
            <div className="p-5 rounded-2xl ai-gradient-bg text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="absolute right-0 top-0 translate-x-20 -translate-y-20 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <span className="text-[10px] uppercase font-black bg-white/20 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Predictive AI Engine v2.0
                </span>
                <h2 className="text-2xl font-black mt-3">Smart Wait & surge Forecasts</h2>
                <p className="text-xs text-indigo-100 mt-1 max-w-xl">
                  Simulate future queue predictions. The dashboard models clinic arrival timelines, patient risk profiles, and consultation durations to coordinate wait buffers.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 relative z-10">
                <button 
                  onClick={() => alert('Recalibrating AI arrival surge algorithms with latest weekly patient records...')}
                  className="px-4 py-2.5 rounded-xl bg-white text-indigo-600 font-bold text-xs shadow-md active:scale-95 transition"
                >
                  Recalibrate Models
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* AI Card 1: Wait Prediction */}
              <div className="glass-panel p-6 border-indigo-100/60 dark:border-slate-850">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🕒</span>
                  <h3 className="font-extrabold text-sm">AI Wait Time Predictor</h3>
                </div>
                <div className="text-xs text-gray-500 mt-2">Adjusted estimated check-in wait:</div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {aiPredictions.waitTimePrediction.predictedWait} avg
                </div>
                <div className="text-[10px] text-gray-400 mt-3 font-semibold">Key predictors:</div>
                <ul className="mt-2 space-y-1 text-[11px] text-gray-500">
                  {aiPredictions.waitTimePrediction.factors.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI Card 2: Queue Optimization */}
              <div className="glass-panel p-6 border-indigo-100/60 dark:border-slate-850">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">⚡</span>
                  <h3 className="font-extrabold text-sm">AI Queue Optimization</h3>
                </div>
                <div className="text-xs text-gray-500 mt-2">Active recommendation:</div>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1.5">
                  {aiPredictions.queueOptimization.recommendation}
                </div>
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 rounded-xl text-[10px] font-bold mt-4">
                  💡 Estimated wait savings: {aiPredictions.queueOptimization.estimatedSavings}
                </div>
              </div>

              {/* AI Card 3: Patient Arrival Predictor */}
              <div className="glass-panel p-6 border-indigo-100/60 dark:border-slate-850">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">📈</span>
                  <h3 className="font-extrabold text-sm">Surge Predictor</h3>
                </div>
                <div className="text-xs text-gray-500 mt-2">Surge risk warning:</div>
                <div className="text-base font-bold text-rose-500 mt-1.5">
                  Fever/Flu surge predicted (85% probability)
                </div>
                <div className="text-[10px] text-gray-400 mt-4">
                  Surge trigger: Seasonal shifts & regional health alerts.
                </div>
              </div>

              {/* AI Card 4: Consultation Duration Predictions */}
              <div className="glass-panel p-6 border-indigo-100/60 dark:border-slate-850">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🩺</span>
                  <h3 className="font-extrabold text-sm">Consultation Duration Forecast</h3>
                </div>
                <div className="text-xs text-gray-500 mt-2">Doctor checkup averages:</div>
                <div className="space-y-2.5 mt-3">
                  {doctors.map(d => (
                    <div key={d.id} className="flex justify-between items-center text-xs">
                      <span className="text-gray-600 dark:text-slate-350">{d.name.split(' ').pop()}</span>
                      <span className="font-bold text-gray-700 dark:text-slate-250">{d.averageConsultationTime} mins avg</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Card 5: Patient Risk Detections */}
              <div className="glass-panel p-6 border-indigo-100/60 dark:border-slate-850">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">⚠️</span>
                  <h3 className="font-extrabold text-sm">Patient Risk Detection</h3>
                </div>
                <div className="text-xs text-gray-500 mt-2">Identified clinic floor risks:</div>
                <div className="p-3 bg-rose-500/5 border border-rose-500/20 text-rose-500 rounded-xl text-[10px] font-bold mt-3.5 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>2 elderly patients waiting &gt; 25 mins. Flagged for seat availability checks.</span>
                </div>
              </div>

              {/* AI Card 6: No-Show Predictors */}
              <div className="glass-panel p-6 border-indigo-100/60 dark:border-slate-850">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🔮</span>
                  <h3 className="font-extrabold text-sm">No-Show Risk Forecast</h3>
                </div>
                <div className="text-xs text-gray-550">Target Patient check: Emily Watson</div>
                <div className="text-xl font-black text-emerald-600 mt-1">
                  {aiPredictions.noShowPrediction.riskScore} Risk score
                </div>
                <div className="text-[10px] text-gray-400 mt-3.5 font-semibold">Risk factor details:</div>
                <ul className="mt-1 space-y-1 text-[10px] text-gray-500 leading-normal">
                  {aiPredictions.noShowPrediction.reasons.map((r, idx) => (
                    <li key={idx}>• {r}</li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        )}

        {/* Tab 4: Subscriptions */}
        {activeTab === 'subscription' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="glass-panel p-6 lg:col-span-2 space-y-6">
              <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-850 pb-4">
                <div>
                  <div className="text-xs text-gray-400 font-bold uppercase">Current Tenant Status</div>
                  <h2 className="text-xl font-bold mt-1 text-gray-800 dark:text-slate-100">Smart Clinic Pro Package</h2>
                </div>
                <span className="text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full">
                  $129/Month Bill Plan
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-150 dark:border-slate-850">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Active Tenant ID</div>
                  <div className="text-xs font-bold text-gray-700 dark:text-slate-200 mt-1">tenant_carefirst_medical_042</div>
                </div>
                <div className="p-4 rounded-xl border border-gray-150 dark:border-slate-850">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Next Invoice Date</div>
                  <div className="text-xs font-bold text-gray-700 dark:text-slate-200 mt-1">August 24, 2026</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-850 flex justify-between items-center gap-4 text-xs">
                <div>
                  <div className="font-bold text-gray-700 dark:text-slate-250">Need more features or clinic branches?</div>
                  <p className="text-[11px] text-gray-500 mt-0.5">Upgrade to Enterprise tier to support unlimited clinics and custom domain setups.</p>
                </div>
                <button
                  onClick={() => alert('Demonstration redirect: Upgrade request sent to Q-Clinix SaaS account manager.')}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] shrink-0"
                >
                  Contact SaaS Rep
                </button>
              </div>
            </div>

            {/* Invoicing logs */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-gray-800 dark:text-slate-100">Recent Invoices</h3>
              
              <div className="space-y-3">
                {[
                  { id: 'INV-0428', date: '2026-07-24', amt: '$129.00', status: 'PAID' },
                  { id: 'INV-0311', date: '2026-06-24', amt: '$129.00', status: 'PAID' },
                  { id: 'INV-0199', date: '2026-05-24', amt: '$129.00', status: 'PAID' },
                ].map((inv) => (
                  <div key={inv.id} className="flex justify-between items-center text-xs p-2.5 rounded bg-slate-50 dark:bg-slate-900/60 border border-gray-150 dark:border-slate-850">
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-slate-200">{inv.id}</div>
                      <div className="text-[9px] text-gray-400 mt-0.5">{inv.date}</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{inv.amt}</span>
                      <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
