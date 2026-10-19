import { Student } from '../../../domain/entities/Student';
import { IStudentRepository } from '../../../domain/repositories/IStudentRepository';
import { ILearnWorldsClient } from '../../../domain/ports/ILearnWorldsClient';
import { IIdGenerator } from '../../../domain/ports/IIdGenerator';
import { NotFoundError } from '../../../domain/errors/DomainError';

/**
 * Resolves a student by email from local DB, or upserts from LearnWorlds.
 */
export class EnsureStudentFromLearnWorldsUseCase {
  constructor(
    private readonly students: IStudentRepository,
    private readonly learnWorlds: ILearnWorldsClient,
    private readonly ids: IIdGenerator,
  ) {}

  async execute(email: string): Promise<Student> {
    const normalized = email.toLowerCase().trim();
    const existing = await this.students.findByEmail(normalized);
    if (existing) return existing;

    const remote = await this.learnWorlds.getUser(normalized);
    if (!remote) {
      throw new NotFoundError('LearnWorlds user', normalized);
    }

    const byLw = await this.students.findByLearnWorldsUserId(remote.id);
    if (byLw) {
      byLw.applySync({
        email: remote.email,
        firstName: remote.firstName,
        lastName: remote.lastName,
        tags: remote.tags,
      });
      return this.students.save(byLw);
    }

    const student = Student.create({
      id: this.ids.generate(),
      learnWorldsUserId: remote.id,
      email: remote.email,
      firstName: remote.firstName,
      lastName: remote.lastName,
      tags: remote.tags,
    });
    return this.students.save(student);
  }
}
