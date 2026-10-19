import { SyncRun } from '../../../domain/entities/SyncRun';
import { ISyncRunRepository } from '../../../domain/repositories/ISyncRunRepository';
import { NotFoundError } from '../../../domain/errors/DomainError';

export class QuerySyncRunUseCase {
  constructor(private readonly syncRuns: ISyncRunRepository) {}

  async byId(id: string): Promise<SyncRun> {
    const run = await this.syncRuns.findById(id);
    if (!run) throw new NotFoundError('SyncRun', id);
    return run;
  }

  async recent(limit = 20): Promise<SyncRun[]> {
    return this.syncRuns.findRecent(limit);
  }

  async byCourse(courseConfigId: string, limit = 20): Promise<SyncRun[]> {
    return this.syncRuns.findByCourse(courseConfigId, limit);
  }
}
