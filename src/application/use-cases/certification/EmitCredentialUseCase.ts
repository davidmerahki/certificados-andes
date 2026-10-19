import { Certification } from '../../../domain/entities/Certification';
import { ICertificationRepository } from '../../../domain/repositories/ICertificationRepository';
import { IStudentRepository } from '../../../domain/repositories/IStudentRepository';
import { ICourseConfigRepository } from '../../../domain/repositories/ICourseConfigRepository';
import { IPokClient } from '../../../domain/ports/IPokClient';
import { IIdGenerator } from '../../../domain/ports/IIdGenerator';
import { ILogger } from '../../../domain/ports/ILogger';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../../domain/errors/DomainError';
import { defaultCycle } from '../../../domain/value-objects/CertificationIdentity';
import { TemplateCompatibilityService } from '../../../domain/services/TemplateCompatibilityService';

export interface EmitCredentialInput {
  studentId: string;
  courseConfigId: string;
  certificationCycle?: string;
  /** If true, do not call POK — mark as simulated */
  simulation?: boolean;
}

export class EmitCredentialUseCase {
  constructor(
    private readonly certifications: ICertificationRepository,
    private readonly students: IStudentRepository,
    private readonly courses: ICourseConfigRepository,
    private readonly pok: IPokClient,
    private readonly ids: IIdGenerator,
    private readonly compatibility: TemplateCompatibilityService,
    private readonly logger: ILogger,
  ) {}

  async execute(input: EmitCredentialInput): Promise<Certification> {
    const cycle = input.certificationCycle ?? defaultCycle();
    const student = await this.students.findById(input.studentId);
    if (!student) throw new NotFoundError('Student', input.studentId);

    const course = await this.courses.findById(input.courseConfigId);
    if (!course) throw new NotFoundError('CourseConfig', input.courseConfigId);
    if (!course.hasTemplate()) {
      throw new ValidationError('Course has no POK template');
    }

    let cert = await this.certifications.findByIdentity(
      student.id,
      course.id,
      cycle,
    );

    if (cert?.isTerminalSuccess()) {
      throw new ConflictError('Certification already emitted for this cycle');
    }

    if (!cert) {
      cert = Certification.createEligible({
        id: this.ids.generate(),
        studentId: student.id,
        courseConfigId: course.id,
        learnWorldsCourseId: course.learnWorldsCourseId,
        certificationCycle: cycle,
        pokTemplateId: course.pokTemplateId!,
        emitterOrganization: course.emitterOrganization,
        configVersionAtEmission: course.configVersion,
      });
      const created = await this.certifications.tryCreate(cert);
      if (!created) {
        const existing = await this.certifications.findByIdentity(
          student.id,
          course.id,
          cycle,
        );
        if (!existing) throw new ConflictError('Concurrent certification conflict');
        cert = existing;
        if (cert.isTerminalSuccess()) {
          throw new ConflictError('Certification already emitted for this cycle');
        }
      } else {
        cert = created;
      }
    }

    if (input.simulation) {
      if (cert.status === 'eligible') {
        cert.markSimulated();
        return this.certifications.save(cert);
      }
      return cert;
    }

    if (!cert.canEmit() && cert.status !== 'pending_emission') {
      throw new ConflictError(`Cannot emit certification in status ${cert.status}`);
    }

    if (cert.status !== 'pending_emission') {
      if (cert.status === 'failed') {
        cert.markRetrying();
      }
      cert.markPendingEmission();
      await this.certifications.save(cert);
    }

    try {
      const template = await this.pok.getTemplate(course.pokTemplateId!);
      let customParameters: Record<string, string> | undefined;
      if (template) {
        const compat = this.compatibility.evaluate(template, student, course);
        if (!compat.compatible) {
          throw new ValidationError(
            `Template incompatible: ${compat.missingFields.join(', ')}`,
          );
        }
        customParameters = compat.availableMappings;
      }

      const result = await this.pok.emitCredential({
        templateId: course.pokTemplateId!,
        receiver: {
          email: student.email,
          firstName: student.firstName,
          lastName: student.lastName,
        },
        credential: {
          title: course.name,
          emitter: course.emitterOrganization,
          tags: course.deliveryConfig.tags,
        },
        customParameters,
        idempotencyKey: cert.idempotencyKey,
      });

      cert.markEmitted(result.credentialId);
      const saved = await this.certifications.save(cert);
      this.logger.info('Credential emitted', {
        certificationId: saved.id,
        pokCredentialId: result.credentialId,
        templateId: course.pokTemplateId,
      });
      return saved;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      cert.markFailed(msg);
      await this.certifications.save(cert);
      this.logger.error('Credential emission failed', {
        certificationId: cert.id,
        error: msg,
      });
      throw e;
    }
  }
}
