export const CertificationStatuses = {
  ELIGIBLE: 'eligible',
  SIMULATED: 'simulated',
  PENDING_EMISSION: 'pending_emission',
  EMITTED: 'emitted',
  FAILED: 'failed',
  RETRYING: 'retrying',
  CANCELLED: 'cancelled',
} as const;

export type CertificationStatus =
  (typeof CertificationStatuses)[keyof typeof CertificationStatuses];

const ALLOWED_TRANSITIONS: Record<CertificationStatus, CertificationStatus[]> = {
  [CertificationStatuses.ELIGIBLE]: [
    CertificationStatuses.SIMULATED,
    CertificationStatuses.PENDING_EMISSION,
    CertificationStatuses.CANCELLED,
  ],
  [CertificationStatuses.SIMULATED]: [
    CertificationStatuses.PENDING_EMISSION,
    CertificationStatuses.CANCELLED,
  ],
  [CertificationStatuses.PENDING_EMISSION]: [
    CertificationStatuses.EMITTED,
    CertificationStatuses.FAILED,
  ],
  [CertificationStatuses.FAILED]: [
    CertificationStatuses.RETRYING,
    CertificationStatuses.CANCELLED,
  ],
  [CertificationStatuses.RETRYING]: [
    CertificationStatuses.PENDING_EMISSION,
    CertificationStatuses.FAILED,
    CertificationStatuses.CANCELLED,
  ],
  [CertificationStatuses.EMITTED]: [],
  [CertificationStatuses.CANCELLED]: [],
};

export function canTransition(
  from: CertificationStatus,
  to: CertificationStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(
  from: CertificationStatus,
  to: CertificationStatus,
): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid certification transition: ${from} → ${to}`);
  }
}
