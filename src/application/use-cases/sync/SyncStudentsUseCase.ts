import { Student } from '../../../domain/entities/Student';
import { IStudentRepository } from '../../../domain/repositories/IStudentRepository';
import { ILearnWorldsClient } from '../../../domain/ports/ILearnWorldsClient';
import { IIdGenerator } from '../../../domain/ports/IIdGenerator';
import { ILogger } from '../../../domain/ports/ILogger';

export interface SyncStudentsResult {
  processed: number;
  created: number;
  updated: number;
}

export class SyncStudentsUseCase {
  constructor(
    private readonly students: IStudentRepository,
    private readonly learnWorlds: ILearnWorldsClient,
    private readonly ids: IIdGenerator,
    private readonly logger: ILogger,
  ) {}

  async execute(options?: {
    maxPages?: number;
    pageSize?: number;
  }): Promise<SyncStudentsResult> {
    const pageSize = options?.pageSize ?? 50;
    const maxPages = options?.maxPages ?? 100;
    let page = 1;
    let processed = 0;
    let created = 0;
    let updated = 0;

    while (page <= maxPages) {
      const batch = await this.learnWorlds.listUsers(page, pageSize);
      if (batch.data.length === 0) break;

      for (const lw of batch.data) {
        const existing = await this.students.findByLearnWorldsUserId(lw.id);
        if (existing) {
          existing.applySync({
            email: lw.email,
            firstName: lw.firstName,
            lastName: lw.lastName,
            tags: lw.tags,
          });
          await this.students.save(existing);
          updated += 1;
        } else {
          const student = Student.create({
            id: this.ids.generate(),
            learnWorldsUserId: lw.id,
            email: lw.email,
            firstName: lw.firstName,
            lastName: lw.lastName,
            tags: lw.tags,
          });
          await this.students.save(student);
          created += 1;
        }
        processed += 1;
      }

      if (page >= batch.totalPages) break;
      page += 1;
    }

    this.logger.info('Students sync completed', { processed, created, updated });
    return { processed, created, updated };
  }
}
