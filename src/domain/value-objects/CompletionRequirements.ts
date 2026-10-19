export interface CompletionRequirements {
  /** Minimum progress percentage (0-100) */
  minProgressPercent: number;
  /** Require LearnWorlds status === completed */
  requireCompletedStatus: boolean;
  /** Optional minimum completed units */
  minCompletedUnits?: number;
}

export function defaultCompletionRequirements(): CompletionRequirements {
  return {
    minProgressPercent: 100,
    requireCompletedStatus: true,
  };
}
