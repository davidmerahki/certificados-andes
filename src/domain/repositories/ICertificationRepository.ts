import { Certification } from '../entities/Certification';
import { CertificationStatus } from '../value-objects/CertificationStatus';

export interface ICertificationRepository {
  save(certification: Certification): Promise<Certification>;
  /**
   * Atomic insert respecting unique index on
   * (studentId, courseConfigId, certificationCycle).
   * Returns null if duplicate already exists.
   */
  tryCreate(certification: Certification): Promise<Certification | null>;
  findById(id: string): Promise<Certification | null>;
  findByIdentity(
    studentId: string,
    courseConfigId: string,
    certificationCycle: string,
  ): Promise<Certification | null>;
  findByIdempotencyKey(key: string): Promise<Certification | null>;
  findByCourse(
    courseConfigId: string,
    filter?: { status?: CertificationStatus },
  ): Promise<Certification[]>;
  findByStudent(studentId: string): Promise<Certification[]>;
  findFailed(limit?: number): Promise<Certification[]>;
  findHistory(options?: {
    courseConfigId?: string;
    studentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Certification[]>;
}
