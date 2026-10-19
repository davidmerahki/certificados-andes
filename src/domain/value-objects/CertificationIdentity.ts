/**
 * Unique identity of a certification within the platform.
 * Same student + different courses are distinct certificates.
 */
export interface CertificationIdentity {
  studentId: string;
  courseConfigId: string;
  certificationCycle: string;
}

export function buildIdempotencyKey(identity: CertificationIdentity): string {
  return `${identity.studentId}:${identity.courseConfigId}:${identity.certificationCycle}`;
}

export function defaultCycle(): string {
  return 'default';
}
