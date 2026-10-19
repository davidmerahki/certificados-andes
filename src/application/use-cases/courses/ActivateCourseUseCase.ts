import { CourseConfig } from '../../../domain/entities/CourseConfig';
import { ICourseConfigRepository } from '../../../domain/repositories/ICourseConfigRepository';
import { NotFoundError } from '../../../domain/errors/DomainError';

export class ActivateCourseUseCase {
  constructor(private readonly courses: ICourseConfigRepository) {}

  async execute(courseId: string): Promise<CourseConfig> {
    const course = await this.courses.findById(courseId);
    if (!course) throw new NotFoundError('CourseConfig', courseId);
    course.activate();
    return this.courses.save(course);
  }
}
