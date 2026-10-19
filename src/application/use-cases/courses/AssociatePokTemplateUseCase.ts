import { CourseConfig } from '../../../domain/entities/CourseConfig';
import { ICourseConfigRepository } from '../../../domain/repositories/ICourseConfigRepository';
import { IPokClient } from '../../../domain/ports/IPokClient';
import { NotFoundError, ValidationError } from '../../../domain/errors/DomainError';

export class AssociatePokTemplateUseCase {
  constructor(
    private readonly courses: ICourseConfigRepository,
    private readonly pok: IPokClient,
  ) {}

  async execute(input: {
    courseId: string;
    pokTemplateId: string;
    emitterOrganization?: string;
    validateRemote?: boolean;
  }): Promise<CourseConfig> {
    const course = await this.courses.findById(input.courseId);
    if (!course) throw new NotFoundError('CourseConfig', input.courseId);

    if (input.validateRemote !== false) {
      const template = await this.pok.getTemplate(input.pokTemplateId);
      if (!template) {
        throw new ValidationError(
          `POK template not found or inaccessible: ${input.pokTemplateId}`,
        );
      }
    }

    course.associateTemplate(input.pokTemplateId, input.emitterOrganization);
    return this.courses.save(course);
  }
}
