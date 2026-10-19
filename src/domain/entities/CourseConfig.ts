import { CourseStatus, CourseStatuses, isProcessable } from '../value-objects/CourseStatus';
import {
  CompletionRequirements,
  defaultCompletionRequirements,
} from '../value-objects/CompletionRequirements';
import {
  EligibilityRules,
  defaultEligibilityRules,
} from '../value-objects/EligibilityRules';
import {
  DeliveryConfig,
  defaultDeliveryConfig,
} from '../value-objects/DeliveryConfig';
import {
  RecertificationPolicy,
  defaultRecertificationPolicy,
} from '../value-objects/RecertificationPolicy';
import { ValidationError, InvariantViolationError } from '../errors/DomainError';

export interface SyncConfig {
  includeInNightlySync: boolean;
  batchSize?: number;
}

export interface CourseConfigProps {
  id: string;
  learnWorldsCourseId: string;
  name: string;
  description?: string;
  status: CourseStatus;
  pokTemplateId?: string;
  emitterOrganization?: string;
  completionRequirements: CompletionRequirements;
  eligibilityRules: EligibilityRules;
  deliveryConfig: DeliveryConfig;
  recertificationPolicy: RecertificationPolicy;
  syncConfig: SyncConfig;
  activatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  configVersion: number;
}

export class CourseConfig {
  private constructor(private props: CourseConfigProps) {}

  static create(input: {
    id: string;
    learnWorldsCourseId: string;
    name: string;
    description?: string;
    pokTemplateId?: string;
    emitterOrganization?: string;
    completionRequirements?: CompletionRequirements;
    eligibilityRules?: EligibilityRules;
    deliveryConfig?: DeliveryConfig;
    recertificationPolicy?: RecertificationPolicy;
    syncConfig?: SyncConfig;
  }): CourseConfig {
    if (!input.learnWorldsCourseId?.trim()) {
      throw new ValidationError('learnWorldsCourseId is required');
    }
    if (!input.name?.trim()) {
      throw new ValidationError('name is required');
    }

    const now = new Date();
    return new CourseConfig({
      id: input.id,
      learnWorldsCourseId: input.learnWorldsCourseId.trim(),
      name: input.name.trim(),
      description: input.description,
      status: CourseStatuses.DRAFT,
      pokTemplateId: input.pokTemplateId,
      emitterOrganization: input.emitterOrganization,
      completionRequirements:
        input.completionRequirements ?? defaultCompletionRequirements(),
      eligibilityRules: input.eligibilityRules ?? defaultEligibilityRules(),
      deliveryConfig: input.deliveryConfig ?? defaultDeliveryConfig(),
      recertificationPolicy:
        input.recertificationPolicy ?? defaultRecertificationPolicy(),
      syncConfig: input.syncConfig ?? { includeInNightlySync: true },
      createdAt: now,
      updatedAt: now,
      configVersion: 1,
    });
  }

  static reconstitute(props: CourseConfigProps): CourseConfig {
    return new CourseConfig(props);
  }

  get id(): string {
    return this.props.id;
  }

  get learnWorldsCourseId(): string {
    return this.props.learnWorldsCourseId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get status(): CourseStatus {
    return this.props.status;
  }

  get pokTemplateId(): string | undefined {
    return this.props.pokTemplateId;
  }

  get emitterOrganization(): string | undefined {
    return this.props.emitterOrganization;
  }

  get completionRequirements(): CompletionRequirements {
    return this.props.completionRequirements;
  }

  get eligibilityRules(): EligibilityRules {
    return this.props.eligibilityRules;
  }

  get deliveryConfig(): DeliveryConfig {
    return this.props.deliveryConfig;
  }

  get recertificationPolicy(): RecertificationPolicy {
    return this.props.recertificationPolicy;
  }

  get syncConfig(): SyncConfig {
    return this.props.syncConfig;
  }

  get activatedAt(): Date | undefined {
    return this.props.activatedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get configVersion(): number {
    return this.props.configVersion;
  }

  isActiveForProcessing(): boolean {
    return isProcessable(this.props.status) && this.props.syncConfig.includeInNightlySync;
  }

  hasTemplate(): boolean {
    return Boolean(this.props.pokTemplateId?.trim());
  }

  updateConfiguration(patch: Partial<{
    name: string;
    description: string;
    pokTemplateId: string;
    emitterOrganization: string;
    completionRequirements: CompletionRequirements;
    eligibilityRules: EligibilityRules;
    deliveryConfig: DeliveryConfig;
    recertificationPolicy: RecertificationPolicy;
    syncConfig: SyncConfig;
  }>): void {
    if (patch.name !== undefined) this.props.name = patch.name.trim();
    if (patch.description !== undefined) this.props.description = patch.description;
    if (patch.pokTemplateId !== undefined) this.props.pokTemplateId = patch.pokTemplateId;
    if (patch.emitterOrganization !== undefined) {
      this.props.emitterOrganization = patch.emitterOrganization;
    }
    if (patch.completionRequirements) {
      this.props.completionRequirements = patch.completionRequirements;
    }
    if (patch.eligibilityRules) this.props.eligibilityRules = patch.eligibilityRules;
    if (patch.deliveryConfig) this.props.deliveryConfig = patch.deliveryConfig;
    if (patch.recertificationPolicy) {
      this.props.recertificationPolicy = patch.recertificationPolicy;
    }
    if (patch.syncConfig) this.props.syncConfig = patch.syncConfig;

    this.props.configVersion += 1;
    this.props.updatedAt = new Date();
  }

  associateTemplate(pokTemplateId: string, emitterOrganization?: string): void {
    if (!pokTemplateId?.trim()) {
      throw new ValidationError('pokTemplateId is required');
    }
    this.props.pokTemplateId = pokTemplateId.trim();
    if (emitterOrganization !== undefined) {
      this.props.emitterOrganization = emitterOrganization;
    }
    this.props.configVersion += 1;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (!this.hasTemplate()) {
      throw new InvariantViolationError(
        'Cannot activate course without a POK template',
      );
    }
    this.props.status = CourseStatuses.ACTIVE;
    this.props.activatedAt = new Date();
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.status = CourseStatuses.INACTIVE;
    this.props.updatedAt = new Date();
  }

  archive(): void {
    this.props.status = CourseStatuses.ARCHIVED;
    this.props.syncConfig = {
      ...this.props.syncConfig,
      includeInNightlySync: false,
    };
    this.props.updatedAt = new Date();
  }

  toProps(): CourseConfigProps {
    return { ...this.props };
  }
}
