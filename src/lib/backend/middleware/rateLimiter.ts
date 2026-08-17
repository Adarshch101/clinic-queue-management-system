import { AppError } from '../errors/AppError';

type LimiterStore = {
  timestamps: number[];
};

export class RateLimiter {
  private static store = new Map<string, LimiterStore>();

  static checkLimit(key: string, maxCalls: number = 60, windowMs: number = 60000) {
    const now = Date.now();
    let record = this.store.get(key);

    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Filter timestamps within current window
    record.timestamps = record.timestamps.filter(t => now - t < windowMs);

    if (record.timestamps.length >= maxCalls) {
      throw new AppError('Too many requests. Rate limit exceeded, please retry later.', 429);
    }

    record.timestamps.push(now);
  }
}
