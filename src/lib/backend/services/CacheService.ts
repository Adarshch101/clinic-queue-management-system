type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class CacheService {
  private static cache = new Map<string, CacheEntry<unknown>>();

  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  static set<T>(key: string, value: T, ttlMs: number = 30000): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  static invalidate(key: string): void {
    this.cache.delete(key);
  }

  static clear(): void {
    this.cache.clear();
  }
}
