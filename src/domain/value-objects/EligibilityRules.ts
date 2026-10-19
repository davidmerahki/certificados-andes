export interface EligibilityRules {
  requireEmail: boolean;
  requireFullName: boolean;
  excludeTags: string[];
  includeOnlyTags: string[];
}

export function defaultEligibilityRules(): EligibilityRules {
  return {
    requireEmail: true,
    requireFullName: true,
    excludeTags: [],
    includeOnlyTags: [],
  };
}
