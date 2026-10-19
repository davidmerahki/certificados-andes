import { CourseConfig } from '../../../domain/entities/CourseConfig';
import { ICourseConfigRepository } from '../../../domain/repositories/ICourseConfigRepository';
import { CourseStatus } from '../../../domain/value-objects/CourseStatus';

export class ListCoursesUseCase {
  constructor(private readonly courses: ICourseConfigRepository) {}

  async execute(filter?: { status?: CourseStatus }): Promise<CourseConfig[]> {
    return this.courses.findAll(filter);
  }
}
