import { SyncRun, CourseSyncResult } from '../../../domain/entities/SyncRun';
import { CourseConfig } from '../../../domain/entities/CourseConfig';
import { ICourseConfigRepository } from '../../../domain/repositories/ICourseConfigRepository';
import { ISyncRunRepository } from '../../../domain/repositories/ISyncRunRepository';
import { IDistributedLock } from '../../../domain/ports/IDistributedLock';
import { IIdGenerator } from '../../../domain/ports/IIdGenerator';
import { ILogger } from '../../../domain/ports/ILogger';
import { ConflictError, NotFoundError } from '../../../domain/errors/DomainError';
import { SyncStudentsUseCase } from './SyncStudentsUseCase';
import { SyncEnrollmentsUseCase } from './SyncEnrollmentsUseCase';
import { IdentifyEligibleStudentsUseCase } from '../certification/IdentifyEligibleStudentsUseCase';
import { EmitCredentialUseCase } from '../certification/EmitCredentialUseCase';
import { SimulateEmissionsUseCase } from '../certification/SimulateEmissionsUseCase';
import { defaultCycle } from '../../../domain/value-objects/CertificationIdentity';

export interface RunSynchronizationInput {
  simulation?: boolean;
  courseConfigId?: string;
  syncStudents?: boolean;
  certificationCycle?: string;
  concurrency?: number;
}

/**
 * Orchestrates multi-course nightly (or on-demand) synchronization.
 * Failures are isolated per course and per student.
 */
export class RunSynchronizationUseCase {
  constructor(
    private readonly courses: ICourseConfigRepository,
    private readonly syncRuns: ISyncRunRepository,
    private readonly lock: IDistributedLock,
    private readonly ids: IIdGenerator,
    private readonly syncStudents: SyncStudentsUseCase,
    private readonly syncEnrollments: SyncEnrollmentsUseCase,
    private readonly identifyEligible: IdentifyEligibleStudentsUseCase,
    private readonly emitCredential: EmitCredentialUseCase,
    private readonly simulateEmissions: SimulateEmissionsUseCase,
    private readonly logger: ILogger,
  ) {}

  async execute(input: RunSynchronizationInput = {}): Promise<SyncRun> {
    const simulation = input.simulation ?? false;
    const lockKey = 'sync:global';
    const acquired = await this.lock.acquire(lockKey, 30 * 60 * 1000);
    if (!acquired) {
      throw new ConflictError('Another synchronization is already running');
    }

    const run = SyncRun.start({
      id: this.ids.generate(),
      mode: input.courseConfigId ? 'course' : simulation ? 'simulation' : 'full',
      simulation,
    });
    await this.syncRuns.save(run);

    try {
      if (input.syncStudents !== false) {
        await this.syncStudents.execute();
      }

      const targetCourses = await this.resolveCourses(input.courseConfigId);
      const concurrency = input.concurrency ?? 3;
      await this.processCoursesInBatches(
        targetCourses,
        concurrency,
        async (course) => {
          const result = await this.processCourse(
            course,
            simulation,
            input.certificationCycle ?? defaultCycle(),
          );
          run.addCourseResult(result);
          await this.syncRuns.save(run);
        },
      );

      run.complete();
      await this.syncRuns.save(run);
      this.logger.info('Synchronization finished', {
        syncRunId: run.id,
        status: run.status,
        totalEligible: run.totalEligible,
      });
      return run;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      run.fail(msg);
      await this.syncRuns.save(run);
      throw e;
    } finally {
      await this.lock.release(lockKey);
    }
  }

  private async resolveCourses(courseConfigId?: string): Promise<CourseConfig[]> {
    if (courseConfigId) {
      const course = await this.courses.findById(courseConfigId);
      if (!course) throw new NotFoundError('CourseConfig', courseConfigId);
      return [course];
    }
    return this.courses.findActiveForSync();
  }

  private async processCourse(
    course: CourseConfig,
    simulation: boolean,
    certificationCycle: string,
  ): Promise<CourseSyncResult> {
    const errors: string[] = [];
    let studentsProcessed = 0;
    let eligibleFound = 0;
    let emissionsRequested = 0;
    let emissionsSimulated = 0;

    try {
      if (!course.hasTemplate()) {
        return {
          courseConfigId: course.id,
          courseName: course.name,
          studentsProcessed: 0,
          eligibleFound: 0,
          emissionsRequested: 0,
          emissionsSimulated: 0,
          errors: ['Course has no POK template configured — skipped'],
          success: false,
        };
      }

      const enrollResult = await this.syncEnrollments.execute(course);
      studentsProcessed = enrollResult.enrollmentsUpserted;
      errors.push(...enrollResult.errors);

      if (simulation) {
        const sim = await this.simulateEmissions.execute(course, certificationCycle);
        eligibleFound = sim.count;
        emissionsSimulated = sim.count;
      } else {
        const candidates = await this.identifyEligible.execute(
          course,
          certificationCycle,
        );
        eligibleFound = candidates.length;

        for (const candidate of candidates) {
          try {
            await this.emitCredential.execute({
              studentId: candidate.student.id,
              courseConfigId: course.id,
              certificationCycle,
              simulation: false,
            });
            emissionsRequested += 1;
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            errors.push(`Emit ${candidate.student.id}: ${msg}`);
          }
        }
      }

      return {
        courseConfigId: course.id,
        courseName: course.name,
        studentsProcessed,
        eligibleFound,
        emissionsRequested,
        emissionsSimulated,
        errors,
        success: errors.length === 0,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error('Course sync failed', {
        courseConfigId: course.id,
        error: msg,
      });
      return {
        courseConfigId: course.id,
        courseName: course.name,
        studentsProcessed,
        eligibleFound,
        emissionsRequested,
        emissionsSimulated,
        errors: [...errors, msg],
        success: false,
      };
    }
  }

  private async processCoursesInBatches(
    courses: CourseConfig[],
    concurrency: number,
    handler: (course: CourseConfig) => Promise<void>,
  ): Promise<void> {
    for (let i = 0; i < courses.length; i += concurrency) {
      const slice = courses.slice(i, i + concurrency);
      await Promise.all(slice.map((c) => handler(c)));
    }
  }
}
