import { CourseConfig } from '../../../domain/entities/CourseConfig';
import { ICourseConfigRepository } from '../../../domain/repositories/ICourseConfigRepository';
import { NotFoundError, ConflictError } from '../../../domain/errors/DomainError';

export class DeactivateCourseUseCase {
  constructor(private readonly courses: ICourseConfigRepository) {}

  async execute(courseId: string, archive = false): Promise<CourseConfig> {
    const course = await this.courses.findById(courseId);
    if (!course) throw new NotFoundError('CourseConfig', courseId);

    const hasHistory = await this.courses.existsWithCertifications(courseId);
    if (archive && !hasHistory) {
      course.archive();
    } else if (archive && hasHistory) {
      // Soft-archive only — never hard-delete courses with certification history
      course.archive();
    } else {
      course.deactivate();
    }

    return this.courses.save(course);
  }

  async refuseHardDelete(courseId: string): Promise<never> {
    const hasHistory = await this.courses.existsWithCertifications(courseId);
    if (hasHistory) {
      throw new ConflictError(
        'Cannot permanently delete a course with certification history. Archive or deactivate instead.',
      );
    }
    throw new ConflictError(
      'Hard delete is disabled. Use deactivate or archive.',
    );
  }
}
