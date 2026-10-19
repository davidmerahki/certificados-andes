export interface IDistributedLock {
  /**
   * Try to acquire a lock. Returns true if acquired.
   */
  acquire(key: string, ttlMs: number): Promise<boolean>;
  release(key: string): Promise<void>;
}
