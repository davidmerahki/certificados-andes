import { CourseConfig } from '../../../domain/entities/CourseConfig';
import { ICourseConfigRepository } from '../../../domain/repositories/ICourseConfigRepository';
import { NotFoundError } from '../../../domain/errors/DomainError';
import { CompletionRequirements } from '../../../domain/value-objects/CompletionRequirements';
import { EligibilityRules } from '../../../domain/value-objects/EligibilityRules';
import { DeliveryConfig } from '../../../domain/value-objects/DeliveryConfig';
import { RecertificationPolicy } from '../../../domain/value-objects/RecertificationPolicy';

export interface UpdateCourseConfigInput {
  courseId: string;
  name?: string;
  description?: string;
  pokTemplateId?: string;
  emitterOrganization?: string;
  completionRequirements?: CompletionRequirements;
  eligibilityRules?: EligibilityRules;
  deliveryConfig?: DeliveryConfig;
  recertificationPolicy?: RecertificationPolicy;
  syncConfig?: { includeInNightlySync: boolean; batchSize?: number };
}

export class UpdateCourseConfigUseCase {
  constructor(private readonly courses: ICourseConfigRepository) {}

  async execute(input: UpdateCourseConfigInput): Promise<CourseConfig> {
    const course = await this.courses.findById(input.courseId);
    if (!course) throw new NotFoundError('CourseConfig', input.courseId);

    course.updateConfiguration({
      name: input.name,
      description: input.description,
      pokTemplateId: input.pokTemplateId,
      emitterOrganization: input.emitterOrganization,
      completionRequirements: input.completionRequirements,
      eligibilityRules: input.eligibilityRules,
      deliveryConfig: input.deliveryConfig,
      recertificationPolicy: input.recertificationPolicy,
      syncConfig: input.syncConfig,
    });

    return this.courses.save(course);
  }
}
