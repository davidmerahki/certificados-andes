import { Enrollment } from '../../../domain/entities/Enrollment';
import { AcademicProgress } from '../../../domain/entities/AcademicProgress';
import { CourseConfig } from '../../../domain/entities/CourseConfig';
import { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository';
import { IAcademicProgressRepository } from '../../../domain/repositories/IAcademicProgressRepository';
import { IStudentRepository } from '../../../domain/repositories/IStudentRepository';
import { ILearnWorldsClient } from '../../../domain/ports/ILearnWorldsClient';
import { IIdGenerator } from '../../../domain/ports/IIdGenerator';
import { ILogger } from '../../../domain/ports/ILogger';

export interface SyncEnrollmentsResult {
  courseConfigId: string;
  enrollmentsUpserted: number;
  progressUpserted: number;
  errors: string[];
}

export class SyncEnrollmentsUseCase {
  constructor(
    private readonly enrollments: IEnrollmentRepository,
    private readonly progress: IAcademicProgressRepository,
    private readonly students: IStudentRepository,
    private readonly learnWorlds: ILearnWorldsClient,
    private readonly ids: IIdGenerator,
    private readonly logger: ILogger,
  ) {}

  async execute(
    course: CourseConfig,
    options?: { pageSize?: number; maxPages?: number },
  ): Promise<SyncEnrollmentsResult> {
    const pageSize = options?.pageSize ?? course.syncConfig.batchSize ?? 50;
    const maxPages = options?.maxPages ?? 100;
    let page = 1;
    let enrollmentsUpserted = 0;
    let progressUpserted = 0;
    const errors: string[] = [];

    while (page <= maxPages) {
      let batch;
      try {
        batch = await this.learnWorlds.listCourseUsers(
          course.learnWorldsCourseId,
          page,
          pageSize,
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Failed listing course users page ${page}: ${msg}`);
        break;
      }

      if (batch.data.length === 0) break;

      for (const lwUser of batch.data) {
        try {
          const student = await this.students.findByLearnWorldsUserId(lwUser.id);
          if (!student) {
            errors.push(`Student not synced yet: ${lwUser.id}`);
            continue;
          }

          const enrollment = Enrollment.create({
            id: this.ids.generate(),
            studentId: student.id,
            courseConfigId: course.id,
            learnWorldsCourseId: course.learnWorldsCourseId,
          });
          await this.enrollments.upsert(enrollment);
          enrollmentsUpserted += 1;

          const lwProgressList = await this.learnWorlds.getUserProgress(lwUser.id);
          const courseProgress = lwProgressList.find(
            (p) => p.courseId === course.learnWorldsCourseId,
          );

          if (courseProgress) {
            const progress = AcademicProgress.create({
              id: this.ids.generate(),
              studentId: student.id,
              courseConfigId: course.id,
              learnWorldsCourseId: course.learnWorldsCourseId,
              progressRate: courseProgress.progressRate,
              status: courseProgress.status,
              completedUnits: courseProgress.completedUnits,
              totalUnits: courseProgress.totalUnits,
            });
            await this.progress.upsert(progress);
            progressUpserted += 1;
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`Student ${lwUser.id}: ${msg}`);
        }
      }

      if (page >= batch.totalPages) break;
      page += 1;
    }

    this.logger.info('Enrollments sync completed', {
      courseConfigId: course.id,
      enrollmentsUpserted,
      progressUpserted,
      errorCount: errors.length,
    });

    return {
      courseConfigId: course.id,
      enrollmentsUpserted,
      progressUpserted,
      errors,
    };
  }
}
