import { CourseConfig } from '../../../../domain/entities/CourseConfig';
import { ICourseConfigRepository } from '../../../../domain/repositories/ICourseConfigRepository';
import { CourseStatus, CourseStatuses } from '../../../../domain/value-objects/CourseStatus';
import { CourseConfigModel } from '../models/CourseConfigModel';
import { CertificationModel } from '../models/CertificationModel';

export class MongoCourseConfigRepository implements ICourseConfigRepository {
  async save(course: CourseConfig): Promise<CourseConfig> {
    const props = course.toProps();
    const doc = await CourseConfigModel.findByIdAndUpdate(
      props.id,
      {
        _id: props.id,
        learnWorldsCourseId: props.learnWorldsCourseId,
        name: props.name,
        description: props.description,
        status: props.status,
        pokTemplateId: props.pokTemplateId,
        emitterOrganization: props.emitterOrganization,
        completionRequirements: props.completionRequirements,
        eligibilityRules: props.eligibilityRules,
        deliveryConfig: props.deliveryConfig,
        recertificationPolicy: props.recertificationPolicy,
        syncConfig: props.syncConfig,
        activatedAt: props.activatedAt,
        configVersion: props.configVersion,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return this.toDomain(doc!);
  }

  async findById(id: string): Promise<CourseConfig | null> {
    const doc = await CourseConfigModel.findById(id);
    return doc ? this.toDomain(doc) : null;
  }

  async findByLearnWorldsCourseId(
    learnWorldsCourseId: string,
  ): Promise<CourseConfig | null> {
    const doc = await CourseConfigModel.findOne({ learnWorldsCourseId });
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(filter?: { status?: CourseStatus }): Promise<CourseConfig[]> {
    const query = filter?.status ? { status: filter.status } : {};
    const docs = await CourseConfigModel.find(query).sort({ name: 1 });
    return docs.map((d) => this.toDomain(d));
  }

  async findActiveForSync(): Promise<CourseConfig[]> {
    const docs = await CourseConfigModel.find({
      status: CourseStatuses.ACTIVE,
      'syncConfig.includeInNightlySync': true,
    });
    return docs.map((d) => this.toDomain(d));
  }

  async existsWithCertifications(courseConfigId: string): Promise<boolean> {
    const count = await CertificationModel.countDocuments({ courseConfigId });
    return count > 0;
  }

  private toDomain(doc: InstanceType<typeof CourseConfigModel>): CourseConfig {
    return CourseConfig.reconstitute({
      id: String(doc._id),
      learnWorldsCourseId: doc.learnWorldsCourseId,
      name: doc.name,
      description: doc.description,
      status: doc.status as CourseStatus,
      pokTemplateId: doc.pokTemplateId,
      emitterOrganization: doc.emitterOrganization,
      completionRequirements: doc.completionRequirements,
      eligibilityRules: doc.eligibilityRules,
      deliveryConfig: doc.deliveryConfig,
      recertificationPolicy: {
        enabled: doc.recertificationPolicy.enabled,
        cycleDurationDays: doc.recertificationPolicy.cycleDurationDays,
        allowManualNewCycle: doc.recertificationPolicy.allowManualNewCycle,
      },
      syncConfig: doc.syncConfig,
      activatedAt: doc.activatedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      configVersion: doc.configVersion,
    });
  }
}
