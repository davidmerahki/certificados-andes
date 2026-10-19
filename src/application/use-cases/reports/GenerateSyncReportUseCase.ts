import { SyncRun } from '../../../domain/entities/SyncRun';
import { ISyncRunRepository } from '../../../domain/repositories/ISyncRunRepository';
import { NotFoundError } from '../../../domain/errors/DomainError';

export interface SyncReport {
  syncRunId: string;
  mode: string;
  status: string;
  simulation: boolean;
  startedAt: Date;
  finishedAt?: Date;
  summary: {
    coursesProcessed: number;
    coursesFailed: number;
    totalEligible: number;
    totalEmitted: number;
    totalFailed: number;
  };
  courses: SyncRun['courseResults'];
}

export class GenerateSyncReportUseCase {
  constructor(private readonly syncRuns: ISyncRunRepository) {}

  async execute(syncRunId: string): Promise<SyncReport> {
    const run = await this.syncRuns.findById(syncRunId);
    if (!run) throw new NotFoundError('SyncRun', syncRunId);

    const courses = run.courseResults;
    return {
      syncRunId: run.id,
      mode: run.mode,
      status: run.status,
      simulation: run.simulation,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      summary: {
        coursesProcessed: courses.length,
        coursesFailed: courses.filter((c) => !c.success).length,
        totalEligible: run.totalEligible,
        totalEmitted: run.totalEmitted,
        totalFailed: run.totalFailed,
      },
      courses,
    };
  }
}
