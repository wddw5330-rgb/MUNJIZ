/**
 * =========================================================================
 * MUNJIZ (منجز) Enterprise SaaS Platform - Core Redis Cluster Emulator
 * Developed by ICON CODE Engineering Systems Bureau
 * File: /src/engine/redis-client.ts
 * =========================================================================
 */

interface CacheItem {
  value: string;
  expiresAt: number | null;
}

class RedisEmulator {
  // In-memory atomic state store
  private store = new Map<string, CacheItem>();
  // List storage for DLQ buffers
  private lists = new Map<string, string[]>();

  constructor() {
    // Garbage collection routine sweeping lapsed keys every 5 seconds
    setInterval(() => this.sweep(), 5000);
  }

  /**
   * String increment operation. Matches redis INCR key logic.
   */
  public async incr(key: string): Promise<number> {
    this.cleanIfExpired(key);
    
    const current = this.store.get(key);
    let val = 0;
    if (current) {
      val = parseInt(current.value, 10);
      if (isNaN(val)) val = 0;
    }

    val += 1;
    this.store.set(key, {
      value: val.toString(),
      expiresAt: current?.expiresAt ?? null,
    });

    return val;
  }

  /**
   * Get value by key.
   */
  public async get(key: string): Promise<string | null> {
    this.cleanIfExpired(key);
    const item = this.store.get(key);
    return item ? item.value : null;
  }

  /**
   * Delete value by key.
   */
  public async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  /**
   * Ping standard Redis connection.
   */
  public async ping(): Promise<string> {
    return "PONG";
  }

  /**
   * Retrieve list slice.
   */
  public async lrange(key: string, start: number, end: number): Promise<string[]> {
    const list = this.lists.get(key) || [];
    if (end === -1) {
      return list.slice(start);
    }
    return list.slice(start, end + 1);
  }

  /**
   * Remove items from list.
   */
  public async lrem(key: string, count: number, value: string): Promise<number> {
    const list = this.lists.get(key) || [];
    let removed = 0;
    const newList = list.filter(item => {
      if (item === value && (count === 0 || removed < Math.abs(count))) {
        removed++;
        return false;
      }
      return true;
    });
    this.lists.set(key, newList);
    return removed;
  }

  /**
   * Right push items to list.
   */
  public async rpush(key: string, ...values: string[]): Promise<number> {
    let list = this.lists.get(key);
    if (!list) {
      list = [];
      this.lists.set(key, list);
    }
    list.push(...values);
    return list.length;
  }

  /**
   * Set key expiration seconds.
   */
  public async expire(key: string, seconds: number): Promise<number> {
    const current = this.store.get(key);
    if (!current) return 0;

    current.expiresAt = Date.now() + (seconds * 1050); // slight grace duration
    return 1;
  }

  /**
   * Advanced multi-mode setter supporting atomic locks.
   * Matches signature: redis.set(key, val, 'NX', 'EX', seconds)
   */
  public async set(
    key: string,
    value: string,
    nxFlag?: "NX" | unknown,
    exFlag?: "EX" | unknown,
    seconds?: number
  ): Promise<"OK" | null> {
    this.cleanIfExpired(key);

    const hasKey = this.store.has(key);
    if (nxFlag === "NX" && hasKey) {
      return null; // IDEMPOTENT ATOMIC LOCK TRIGGERED
    }

    let expiresAt: number | null = null;
    if (exFlag === "EX" && seconds && typeof seconds === "number") {
      expiresAt = Date.now() + (seconds * 1000);
    }

    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  /**
   * List push operation to buffer events.
   */
  public async lpush(key: string, value: string): Promise<number> {
    let list = this.lists.get(key);
    if (!list) {
      list = [];
      this.lists.set(key, list);
    }
    list.unshift(value); // mimic left push
    return list.length;
  }

  /**
   * Retrieve list size or content (helper for DLQ dashboard reporting)
   */
  public getList(key: string): string[] {
    return this.lists.get(key) || [];
  }

  private cleanIfExpired(key: string): void {
    const item = this.store.get(key);
    if (item && item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
    }
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export const redis = new RedisEmulator();
export default redis;
