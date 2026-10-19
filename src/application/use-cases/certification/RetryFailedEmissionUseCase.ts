import { Certification } from '../../../domain/entities/Certification';
import { ICertificationRepository } from '../../../domain/repositories/ICertificationRepository';
import { NotFoundError, ConflictError } from '../../../domain/errors/DomainError';
import { EmitCredentialUseCase } from './EmitCredentialUseCase';
import { CertificationStatuses } from '../../../domain/value-objects/CertificationStatus';

export class RetryFailedEmissionUseCase {
  constructor(
    private readonly certifications: ICertificationRepository,
    private readonly emitCredential: EmitCredentialUseCase,
  ) {}

  async execute(certificationId: string): Promise<Certification> {
    const cert = await this.certifications.findById(certificationId);
    if (!cert) throw new NotFoundError('Certification', certificationId);

    if (cert.status !== CertificationStatuses.FAILED) {
      throw new ConflictError(
        `Only failed emissions can be retried (current: ${cert.status})`,
      );
    }

    cert.markRetrying();
    await this.certifications.save(cert);

    return this.emitCredential.execute({
      studentId: cert.studentId,
      courseConfigId: cert.courseConfigId,
      certificationCycle: cert.certificationCycle,
      simulation: false,
    });
  }
}
