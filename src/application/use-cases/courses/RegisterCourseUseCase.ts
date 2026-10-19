import { CourseConfig } from '../../../domain/entities/CourseConfig';
import { ICourseConfigRepository } from '../../../domain/repositories/ICourseConfigRepository';
import { IIdGenerator } from '../../../domain/ports/IIdGenerator';
import { ILearnWorldsClient } from '../../../domain/ports/ILearnWorldsClient';
import { ConflictError, ValidationError } from '../../../domain/errors/DomainError';
import { CompletionRequirements } from '../../../domain/value-objects/CompletionRequirements';
import { EligibilityRules } from '../../../domain/value-objects/EligibilityRules';
import { DeliveryConfig } from '../../../domain/value-objects/DeliveryConfig';
import { RecertificationPolicy } from '../../../domain/value-objects/RecertificationPolicy';

export interface RegisterCourseInput {
  learnWorldsCourseId: string;
  name: string;
  description?: string;
  pokTemplateId?: string;
  emitterOrganization?: string;
  completionRequirements?: CompletionRequirements;
  eligibilityRules?: EligibilityRules;
  deliveryConfig?: DeliveryConfig;
  recertificationPolicy?: RecertificationPolicy;
  validateRemote?: boolean;
}

export class RegisterCourseUseCase {
  constructor(
    private readonly courses: ICourseConfigRepository,
    private readonly ids: IIdGenerator,
    private readonly learnWorlds: ILearnWorldsClient,
  ) {}

  async execute(input: RegisterCourseInput): Promise<CourseConfig> {
    const existing = await this.courses.findByLearnWorldsCourseId(
      input.learnWorldsCourseId,
    );
    if (existing) {
      throw new ConflictError(
        `Course already registered for LearnWorlds id ${input.learnWorldsCourseId}`,
      );
    }

    if (input.validateRemote !== false) {
      const remote = await this.learnWorlds.getCourse(input.learnWorldsCourseId);
      if (!remote) {
        throw new ValidationError(
          `LearnWorlds course not found or inaccessible: ${input.learnWorldsCourseId}`,
        );
      }
    }

    const course = CourseConfig.create({
      id: this.ids.generate(),
      learnWorldsCourseId: input.learnWorldsCourseId,
      name: input.name,
      description: input.description,
      pokTemplateId: input.pokTemplateId,
      emitterOrganization: input.emitterOrganization,
      completionRequirements: input.completionRequirements,
      eligibilityRules: input.eligibilityRules,
      deliveryConfig: input.deliveryConfig,
      recertificationPolicy: input.recertificationPolicy,
    });

    return this.courses.save(course);
  }
}
