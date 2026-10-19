import { Certification } from '../../../../domain/entities/Certification';
import { ICertificationRepository } from '../../../../domain/repositories/ICertificationRepository';
import { CertificationStatus } from '../../../../domain/value-objects/CertificationStatus';
import { CertificationModel } from '../models/CertificationModel';

export class MongoCertificationRepository implements ICertificationRepository {
  async save(certification: Certification): Promise<Certification> {
    const props = certification.toProps();
    const doc = await CertificationModel.findByIdAndUpdate(
      props.id,
      this.toDocument(props),
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return this.toDomain(doc!);
  }

  async tryCreate(certification: Certification): Promise<Certification | null> {
    const props = certification.toProps();
    try {
      const doc = await CertificationModel.create({
        _id: props.id,
        ...this.toDocument(props),
      });
      return this.toDomain(doc);
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code: number }).code === 11000
      ) {
        return null;
      }
      throw e;
    }
  }

  async findById(id: string): Promise<Certification | null> {
    const doc = await CertificationModel.findById(id);
    return doc ? this.toDomain(doc) : null;
  }

  async findByIdentity(
    studentId: string,
    courseConfigId: string,
    certificationCycle: string,
  ): Promise<Certification | null> {
    const doc = await CertificationModel.findOne({
      studentId,
      courseConfigId,
      certificationCycle,
    });
    return doc ? this.toDomain(doc) : null;
  }

  async findByIdempotencyKey(key: string): Promise<Certification | null> {
    const doc = await CertificationModel.findOne({ idempotencyKey: key });
    return doc ? this.toDomain(doc) : null;
  }

  async findByCourse(
    courseConfigId: string,
    filter?: { status?: CertificationStatus },
  ): Promise<Certification[]> {
    const query: Record<string, unknown> = { courseConfigId };
    if (filter?.status) query.status = filter.status;
    const docs = await CertificationModel.find(query).sort({ createdAt: -1 });
    return docs.map((d) => this.toDomain(d));
  }

  async findByStudent(studentId: string): Promise<Certification[]> {
    const docs = await CertificationModel.find({ studentId }).sort({
      createdAt: -1,
    });
    return docs.map((d) => this.toDomain(d));
  }

  async findFailed(limit = 50): Promise<Certification[]> {
    const docs = await CertificationModel.find({ status: 'failed' })
      .sort({ updatedAt: -1 })
      .limit(limit);
    return docs.map((d) => this.toDomain(d));
  }

  async findHistory(options?: {
    courseConfigId?: string;
    studentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Certification[]> {
    const query: Record<string, unknown> = {};
    if (options?.courseConfigId) query.courseConfigId = options.courseConfigId;
    if (options?.studentId) query.studentId = options.studentId;
    const docs = await CertificationModel.find(query)
      .sort({ createdAt: -1 })
      .skip(options?.offset ?? 0)
      .limit(options?.limit ?? 100);
    return docs.map((d) => this.toDomain(d));
  }

  private toDocument(props: ReturnType<Certification['toProps']>) {
    return {
      studentId: props.studentId,
      courseConfigId: props.courseConfigId,
      learnWorldsCourseId: props.learnWorldsCourseId,
      certificationCycle: props.certificationCycle,
      idempotencyKey: props.idempotencyKey,
      status: props.status,
      pokTemplateId: props.pokTemplateId,
      emitterOrganization: props.emitterOrganization,
      pokCredentialId: props.pokCredentialId,
      configVersionAtEmission: props.configVersionAtEmission,
      simulated: props.simulated,
      failureReason: props.failureReason,
      attemptCount: props.attemptCount,
      emittedAt: props.emittedAt,
    };
  }

  private toDomain(doc: InstanceType<typeof CertificationModel>): Certification {
    return Certification.reconstitute({
      id: String(doc._id),
      studentId: doc.studentId,
      courseConfigId: doc.courseConfigId,
      learnWorldsCourseId: doc.learnWorldsCourseId,
      certificationCycle: doc.certificationCycle,
      idempotencyKey: doc.idempotencyKey,
      status: doc.status as CertificationStatus,
      pokTemplateId: doc.pokTemplateId,
      emitterOrganization: doc.emitterOrganization,
      pokCredentialId: doc.pokCredentialId,
      configVersionAtEmission: doc.configVersionAtEmission,
      simulated: doc.simulated,
      failureReason: doc.failureReason,
      attemptCount: doc.attemptCount,
      emittedAt: doc.emittedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
