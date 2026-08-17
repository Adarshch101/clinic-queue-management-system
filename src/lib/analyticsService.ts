import { prisma } from './prisma';

export interface CSVReportFilters {
  type: string;
  clinicId?: string | null;
  doctorId?: string | null;
  dateRange?: string;
}

export class AnalyticsService {

  // 1. Log a business event to the database
  static async trackEvent(clinicId: string | null, eventType: string, payload: Record<string, unknown>) {
    console.log(`[ANALYTICS] Tracking Event: ${eventType} | Clinic: ${clinicId}`);
    try {
      await prisma.analyticsEvent.create({
        data: {
          clinicId,
          eventType,
          payload: JSON.stringify(payload),
        }
      });
    } catch (e) {
      console.error('Failed to log analytics event:', e);
    }
  }

  // 2. Compute real dashboard analytics from the database
  static async getDashboardAnalytics(clinicId: string | null, dateRange: string = '7d') {
    const days = dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : dateRange === '24h' ? 1 : 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rangeStart = new Date(today);
    rangeStart.setDate(today.getDate() - (days - 1));

    const baseWhere = clinicId ? { clinicId } : {};
    const rangeWhere = { ...baseWhere, createdAt: { gte: rangeStart } };

    // --- Counts ---
    const totalTokensCount = await prisma.queueToken.count({ where: rangeWhere });
    const completedCount = await prisma.queueToken.count({ where: { status: 'COMPLETED', ...rangeWhere } });
    const cancelledCount = await prisma.queueToken.count({ where: { status: 'CANCELLED', ...rangeWhere } });
    const noShowCount = await prisma.queueToken.count({ where: { status: 'NO_SHOW', ...rangeWhere } });
    const emergencyCount = await prisma.queueToken.count({ where: { isEmergency: true, ...rangeWhere } });
    const priorityCount = await prisma.queueToken.count({ where: { priority: { gt: 0 }, ...rangeWhere } });
    const patientsToday = await prisma.queueToken.count({ where: { ...baseWhere, createdAt: { gte: today } } });
    const bookedCount = await prisma.queueToken.count({ where: { appointmentId: { not: null }, ...rangeWhere } });

    const doctorsCount = await prisma.doctor.count(clinicId ? { where: { clinicId } } : undefined);
    const clinicsCount = await prisma.clinic.count();

    // --- Real average wait time: avg(calledAt - createdAt) over ranged tokens ---
    const waitedTokens = await prisma.queueToken.findMany({
      where: { ...rangeWhere, calledAt: { not: null } },
      select: { createdAt: true, calledAt: true },
    });
    const waitDurations = waitedTokens
      .map((t) => (t.calledAt!.getTime() - t.createdAt.getTime()) / 60000)
      .filter((d) => d >= 0 && Number.isFinite(d));
    const averageWaitTime = waitDurations.length
      ? Math.round(waitDurations.reduce((a, b) => a + b, 0) / waitDurations.length)
      : 0;

    // --- Real average consult time: avg(completedAt - startedAt) for completed tokens ---
    const consultTokens = await prisma.queueToken.findMany({
      where: { ...rangeWhere, status: 'COMPLETED', startedAt: { not: null }, completedAt: { not: null } },
      select: { startedAt: true, completedAt: true },
    });
    const consultDurations = consultTokens
      .map((t) => (t.completedAt!.getTime() - t.startedAt!.getTime()) / 60000)
      .filter((d) => d >= 0 && Number.isFinite(d));
    const averageConsultTime = consultDurations.length
      ? Math.round(consultDurations.reduce((a, b) => a + b, 0) / consultDurations.length)
      : 0;

    // --- Visits timeline grouped by real days ---
    const timelineTokens = await prisma.queueToken.findMany({
      where: rangeWhere,
      select: { createdAt: true, status: true },
    });

    const visitsTimeline = [];
    for (let i = 0; i < days; i++) {
      const day = new Date(rangeStart);
      day.setDate(rangeStart.getDate() + i);
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTokens = timelineTokens.filter((t) => t.createdAt >= dayStart && t.createdAt <= dayEnd);
      visitsTimeline.push({
        date: day.toISOString().split('T')[0],
        label: day.toLocaleDateString('en-US', { weekday: 'short' }),
        visits: dayTokens.length,
        completed: dayTokens.filter((t) => t.status === 'COMPLETED').length,
        waitTime: averageWaitTime,
      });
    }

    // --- Hourly distribution from real createdAt hours ---
    const hourlyLabels = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
    const hourlyDistribution = hourlyLabels.map((hour) => {
      let startHour = parseInt(hour.split(':')[0], 10);
      const isPM = hour.includes('PM') && startHour !== 12;
      if (isPM) startHour += 12;
      if (hour.includes('AM') && startHour === 12) startHour = 0;
      const count = timelineTokens.filter((t) => t.createdAt.getHours() === startHour).length;
      return { hour, count };
    });

    // --- Real patient demographics ---
    const patientRows = await prisma.patient.findMany({
      where: clinicId ? { clinicId } : undefined,
      select: { gender: true, age: true },
    });

    const genderCounts: Record<string, number> = { Female: 0, Male: 0, Other: 0 };
    const ageCounts: Record<string, number> = { '0-18 yrs': 0, '19-35 yrs': 0, '36-60 yrs': 0, '60+ yrs': 0 };

    for (const p of patientRows) {
      const g = (p.gender || 'Other').toLowerCase();
      if (g.startsWith('f')) genderCounts.Female++;
      else if (g.startsWith('m')) genderCounts.Male++;
      else genderCounts.Other++;

      if (p.age <= 18) ageCounts['0-18 yrs']++;
      else if (p.age <= 35) ageCounts['19-35 yrs']++;
      else if (p.age <= 60) ageCounts['36-60 yrs']++;
      else ageCounts['60+ yrs']++;
    }

    const demographics = {
      gender: Object.entries(genderCounts).map(([label, value]) => ({ label, value })),
      age: Object.entries(ageCounts).map(([label, value]) => ({ label, value })),
    };

    // --- Real reason popularity from queue token reasons ---
    const reasonRows = await prisma.queueToken.findMany({
      where: rangeWhere,
      select: { reason: true },
    });
    const reasonMap = new Map<string, number>();
    for (const r of reasonRows) {
      const key = (r.reason || '').trim() || 'General Checkup';
      reasonMap.set(key, (reasonMap.get(key) || 0) + 1);
    }
    const reasons = Array.from(reasonMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // --- Doctor utilization from real active flags ---
    const utilDoctors = await prisma.doctor.findMany({
      where: clinicId ? { clinicId } : undefined,
      select: { isActive: true },
    });
    const activeDoctors = utilDoctors.filter((d) => d.isActive === 'true').length;
    const doctorUtilizationRate = utilDoctors.length
      ? Math.round((activeDoctors / utilDoctors.length) * 100)
      : 0;

    return {
      kpis: {
        patientsToday,
        patientsThisWeek: totalTokensCount,
        patientsThisMonth: totalTokensCount,
        avgWaitTime: averageWaitTime,
        avgConsultTime: averageConsultTime,
        completedVisits: completedCount,
        cancelledVisits: cancelledCount,
        noShowsCount: noShowCount,
        walkinsCount: Math.max(0, totalTokensCount - bookedCount),
        emergencyCount,
        priorityCount,
        doctorUtilizationRate,
      },
      visitsTimeline,
      hourlyDistribution,
      demographics,
      reasons,
      doctorsCount,
      clinicsCount
    };
  }

  // 3. Generate detailed dynamic reports CSV payload from real data
  static async compileCSVReport(filters: CSVReportFilters) {
    const { type, clinicId, dateRange } = filters;

    const days = dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 7;
    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setDate(rangeStart.getDate() - (days - 1));

    const where = clinicId ? { clinicId } : {};
    const rangeWhere = { ...where, createdAt: { gte: rangeStart } };

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

    if (type === 'DOCTOR') {
      const doctors = await prisma.doctor.findMany({ where: clinicId ? { clinicId } : undefined });

      let csv = 'Doctor Name,Department,Avg Wait (m),Avg Consult (m),Served Patients\n';
      for (const doc of doctors) {
        const tokens = await prisma.queueToken.findMany({
          where: { doctorId: doc.id, ...rangeWhere },
          select: { createdAt: true, calledAt: true, startedAt: true, completedAt: true, status: true },
        });

        const waits = tokens
          .filter((t) => t.calledAt)
          .map((t) => (t.calledAt!.getTime() - t.createdAt.getTime()) / 60000)
          .filter((d) => d >= 0);
        const consults = tokens
          .filter((t) => t.status === 'COMPLETED' && t.startedAt && t.completedAt)
          .map((t) => (t.completedAt!.getTime() - t.startedAt!.getTime()) / 60000)
          .filter((d) => d >= 0);
        const avgWait = waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0;
        const avgConsult = consults.length ? Math.round(consults.reduce((a, b) => a + b, 0) / consults.length) : 0;
        const served = tokens.filter((t) => t.status === 'COMPLETED').length;

        csv += `${escapeCsv(doc.name)},${escapeCsv(doc.specialization)},${avgWait},${avgConsult},${served}\n`;
      }
      return csv;
    }

    if (type === 'PATIENT') {
      const visits = await prisma.visit.findMany({
        where: clinicId ? { patient: { clinicId } } : undefined,
        include: { patient: true, doctor: true },
        orderBy: { visitDate: 'desc' },
      });

      let csv = 'Patient Name,Gender,Age,Diagnosis,Doctor,Visit Date\n';
      for (const v of visits) {
        csv += `${escapeCsv(v.patient.name)},${escapeCsv(v.patient.gender)},${v.patient.age},${escapeCsv(v.diagnosis)},${escapeCsv(v.doctor.name)},${v.visitDate.toISOString().split('T')[0]}\n`;
      }
      return csv;
    }

    if (type === 'QUEUE') {
      const tokens = await prisma.queueToken.findMany({
        where: rangeWhere,
        select: { createdAt: true, status: true, estimatedWait: true },
      });

      let csv = 'Date,Queue Size,Avg Est. Wait (m),Completed,Cancelled,Completion Rate\n';
      const byDay = new Map<string, { total: number; wait: number; completed: number; cancelled: number }>();
      for (const t of tokens) {
        const key = t.createdAt.toISOString().split('T')[0];
        if (!byDay.has(key)) byDay.set(key, { total: 0, wait: 0, completed: 0, cancelled: 0 });
        const entry = byDay.get(key)!;
        entry.total++;
        entry.wait += t.estimatedWait;
        if (t.status === 'COMPLETED') entry.completed++;
        if (t.status === 'CANCELLED') entry.cancelled++;
      }
      for (const [date, e] of Array.from(byDay.entries()).sort()) {
        const avgWait = e.total ? Math.round(e.wait / e.total) : 0;
        const rate = e.total ? Math.round((e.completed / e.total) * 100) : 0;
        csv += `${date},${e.total},${avgWait},${e.completed},${e.cancelled},${rate}%\n`;
      }
      return csv;
    }

    // Default: general clinic summary
    const totalTokensCount = await prisma.queueToken.count({ where: rangeWhere });
    const completedCount = await prisma.queueToken.count({ where: { status: 'COMPLETED', ...rangeWhere } });
    const cancelledCount = await prisma.queueToken.count({ where: { status: 'CANCELLED', ...rangeWhere } });
    const walkinsCount = await prisma.queueToken.count({
      where: { appointmentId: null, ...rangeWhere },
    });

    const waited = await prisma.queueToken.findMany({
      where: { ...rangeWhere, calledAt: { not: null } },
      select: { createdAt: true, calledAt: true },
    });
    const avgWait = waited.length
      ? Math.round(waited.reduce((sum, t) => sum + (t.calledAt!.getTime() - t.createdAt.getTime()) / 60000, 0) / waited.length)
      : 0;

    const walkinRatio = totalTokensCount ? Math.round((walkinsCount / totalTokensCount) * 100) : 0;

    return [
      `Metric Label,Weekly Value,Growth Indicator`,
      `Total Waitlist Served,${totalTokensCount},-`,
      `Average Patient Wait Duration,${avgWait} mins,-`,
      `Completed Visits,${completedCount},-`,
      `Cancelled Visits,${cancelledCount},-`,
      `Walk-in Ratio,${walkinRatio}%,-`,
    ].join('\n');
  }
}