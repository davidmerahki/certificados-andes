import { CourseConfig } from '../../../domain/entities/CourseConfig';
import { ICourseConfigRepository } from '../../../domain/repositories/ICourseConfigRepository';
import { NotFoundError } from '../../../domain/errors/DomainError';

export class GetCourseUseCase {
  constructor(private readonly courses: ICourseConfigRepository) {}

  async execute(courseId: string): Promise<CourseConfig> {
    const course = await this.courses.findById(courseId);
    if (!course) throw new NotFoundError('CourseConfig', courseId);
    return course;
  }
}
