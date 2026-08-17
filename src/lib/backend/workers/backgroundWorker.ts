import { prisma } from '@/lib/prisma';

export class BackgroundWorker {
  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning = false;

  static start(intervalMs: number = 10000) {
    if (this.intervalId) return;

    console.log('[Background Worker]: Starting operational job cycles...');
    this.intervalId = setInterval(async () => {
      if (this.isRunning) return;
      this.isRunning = true;
      try {
        await this.runJobs();
      } catch (e) {
        console.error('[Background Worker Error]:', e);
      } finally {
        this.isRunning = false;
      }
    }, intervalMs);
  }

  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Background Worker]: Stopped job loops.');
    }
  }

  private static async runJobs() {
    // Job 1: Auto-complete / expire checkout entries older than 8 hours
    const cutOff = new Date(Date.now() - 8 * 60 * 60 * 1000);
    const expiredCount = await prisma.queueToken.updateMany({
      where: {
        status: { in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] },
        createdAt: { lt: cutOff }
      },
      data: {
        status: 'CANCELLED'
      }
    });

    if (expiredCount.count > 0) {
      console.log(`[Background Worker]: Cleaned up ${expiredCount.count} expired queue tickets.`);
    }

    // Job 2: Process scheduled email reports retry queues
    // (This is an extensibility hook for production CRON routines)
  }
}
