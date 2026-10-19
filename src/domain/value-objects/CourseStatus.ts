export const CourseStatuses = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
  DRAFT: 'draft',
} as const;

export type CourseStatus = (typeof CourseStatuses)[keyof typeof CourseStatuses];

export function isProcessable(status: CourseStatus): boolean {
  return status === CourseStatuses.ACTIVE;
}
