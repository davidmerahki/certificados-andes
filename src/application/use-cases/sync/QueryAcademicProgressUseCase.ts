import { AcademicProgress } from '../../../domain/entities/AcademicProgress';
import { IAcademicProgressRepository } from '../../../domain/repositories/IAcademicProgressRepository';
import { NotFoundError } from '../../../domain/errors/DomainError';

export class QueryAcademicProgressUseCase {
  constructor(private readonly progress: IAcademicProgressRepository) {}

  async byStudentAndCourse(
    studentId: string,
    courseConfigId: string,
  ): Promise<AcademicProgress> {
    const found = await this.progress.findByStudentAndCourse(
      studentId,
      courseConfigId,
    );
    if (!found) throw new NotFoundError('AcademicProgress');
    return found;
  }

  async byCourse(courseConfigId: string): Promise<AcademicProgress[]> {
    return this.progress.findByCourse(courseConfigId);
  }
}
