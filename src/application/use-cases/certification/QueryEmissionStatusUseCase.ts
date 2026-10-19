import { Certification } from '../../../domain/entities/Certification';
import { ICertificationRepository } from '../../../domain/repositories/ICertificationRepository';
import { IPokClient } from '../../../domain/ports/IPokClient';
import { NotFoundError } from '../../../domain/errors/DomainError';

export interface EmissionStatusView {
  certification: Certification;
  pokState?: string;
}

export class QueryEmissionStatusUseCase {
  constructor(
    private readonly certifications: ICertificationRepository,
    private readonly pok: IPokClient,
  ) {}

  async execute(certificationId: string): Promise<EmissionStatusView> {
    const certification = await this.certifications.findById(certificationId);
    if (!certification) {
      throw new NotFoundError('Certification', certificationId);
    }

    let pokState: string | undefined;
    if (certification.pokCredentialId) {
      const remote = await this.pok.getCredential(certification.pokCredentialId);
      pokState = remote?.state;
    }

    return { certification, pokState };
  }
}
