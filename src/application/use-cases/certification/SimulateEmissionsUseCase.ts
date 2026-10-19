import { Certification } from '../../../domain/entities/Certification';
import { CourseConfig } from '../../../domain/entities/CourseConfig';
import { ICertificationRepository } from '../../../domain/repositories/ICertificationRepository';
import { IIdGenerator } from '../../../domain/ports/IIdGenerator';
import { IdentifyEligibleStudentsUseCase } from './IdentifyEligibleStudentsUseCase';
import { defaultCycle } from '../../../domain/value-objects/CertificationIdentity';
import { ValidationError } from '../../../domain/errors/DomainError';

export interface SimulationResult {
  courseConfigId: string;
  wouldEmit: Array<{
    studentId: string;
    email: string;
    pokTemplateId: string;
    certificationId: string;
  }>;
  count: number;
}

export class SimulateEmissionsUseCase {
  constructor(
    private readonly identifyEligible: IdentifyEligibleStudentsUseCase,
    private readonly certifications: ICertificationRepository,
    private readonly ids: IIdGenerator,
  ) {}

  async execute(
    course: CourseConfig,
    certificationCycle = defaultCycle(),
  ): Promise<SimulationResult> {
    if (!course.hasTemplate()) {
      throw new ValidationError('Course has no POK template configured');
    }

    const candidates = await this.identifyEligible.execute(
      course,
      certificationCycle,
    );
    const wouldEmit: SimulationResult['wouldEmit'] = [];

    for (const candidate of candidates) {
      const cert = Certification.createEligible({
        id: this.ids.generate(),
        studentId: candidate.student.id,
        courseConfigId: course.id,
        learnWorldsCourseId: course.learnWorldsCourseId,
        certificationCycle,
        pokTemplateId: course.pokTemplateId!,
        emitterOrganization: course.emitterOrganization,
        configVersionAtEmission: course.configVersion,
      });
      cert.markSimulated();

      const saved = await this.certifications.tryCreate(cert);
      if (saved) {
        wouldEmit.push({
          studentId: candidate.student.id,
          email: candidate.student.email,
          pokTemplateId: course.pokTemplateId!,
          certificationId: saved.id,
        });
      }
    }

    return {
      courseConfigId: course.id,
      wouldEmit,
      count: wouldEmit.length,
    };
  }
}
