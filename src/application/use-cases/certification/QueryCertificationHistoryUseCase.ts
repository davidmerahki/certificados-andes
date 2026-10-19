import { Certification } from '../../../domain/entities/Certification';
import { ICertificationRepository } from '../../../domain/repositories/ICertificationRepository';

export class QueryCertificationHistoryUseCase {
  constructor(private readonly certifications: ICertificationRepository) {}

  async execute(options?: {
    courseConfigId?: string;
    studentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Certification[]> {
    return this.certifications.findHistory(options);
  }

  async byCourse(courseConfigId: string): Promise<Certification[]> {
    return this.certifications.findByCourse(courseConfigId);
  }
}
