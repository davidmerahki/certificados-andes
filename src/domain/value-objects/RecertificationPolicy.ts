export interface RecertificationPolicy {
  enabled: boolean;
  /** Days after which a new cycle can start; null = never auto-recertify */
  cycleDurationDays: number | null;
  allowManualNewCycle: boolean;
}

export function defaultRecertificationPolicy(): RecertificationPolicy {
  return {
    enabled: false,
    cycleDurationDays: null,
    allowManualNewCycle: true,
  };
}
