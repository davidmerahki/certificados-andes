import { SyncRun } from '../entities/SyncRun';

export interface ISyncRunRepository {
  save(run: SyncRun): Promise<SyncRun>;
  findById(id: string): Promise<SyncRun | null>;
  findRecent(limit?: number): Promise<SyncRun[]>;
  findByCourse(courseConfigId: string, limit?: number): Promise<SyncRun[]>;
  findRunning(): Promise<SyncRun | null>;
}
