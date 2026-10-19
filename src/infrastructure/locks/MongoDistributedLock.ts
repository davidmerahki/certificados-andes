import { IDistributedLock } from '../../domain/ports/IDistributedLock';
import { LockModel } from '../persistence/mongoose/models/LockModel';

export class MongoDistributedLock implements IDistributedLock {
  async acquire(key: string, ttlMs: number): Promise<boolean> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);

    // Clean expired lock first
    await LockModel.deleteMany({ key, expiresAt: { $lte: now } });

    try {
      await LockModel.create({ key, expiresAt });
      return true;
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code: number }).code === 11000
      ) {
        return false;
      }
      throw e;
    }
  }

  async release(key: string): Promise<void> {
    await LockModel.deleteOne({ key });
  }
}
