export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface AcademicProgressProps {
  id: string;
  studentId: string;
  courseConfigId: string;
  learnWorldsCourseId: string;
  progressRate: number;
  status: ProgressStatus;
  completedUnits: number;
  totalUnits: number;
  syncedAt: Date;
}

export class AcademicProgress {
  private constructor(private props: AcademicProgressProps) {}

  static create(input: {
    id: string;
    studentId: string;
    courseConfigId: string;
    learnWorldsCourseId: string;
    progressRate: number;
    status: ProgressStatus;
    completedUnits: number;
    totalUnits: number;
  }): AcademicProgress {
    return new AcademicProgress({
      ...input,
      progressRate: Math.max(0, Math.min(100, input.progressRate)),
      syncedAt: new Date(),
    });
  }

  static reconstitute(props: AcademicProgressProps): AcademicProgress {
    return new AcademicProgress(props);
  }

  get id(): string {
    return this.props.id;
  }

  get studentId(): string {
    return this.props.studentId;
  }

  get courseConfigId(): string {
    return this.props.courseConfigId;
  }

  get learnWorldsCourseId(): string {
    return this.props.learnWorldsCourseId;
  }

  get progressRate(): number {
    return this.props.progressRate;
  }

  get status(): ProgressStatus {
    return this.props.status;
  }

  get completedUnits(): number {
    return this.props.completedUnits;
  }

  get totalUnits(): number {
    return this.props.totalUnits;
  }

  get syncedAt(): Date {
    return this.props.syncedAt;
  }

  updateFromRemote(data: {
    progressRate: number;
    status: ProgressStatus;
    completedUnits: number;
    totalUnits: number;
  }): void {
    this.props.progressRate = Math.max(0, Math.min(100, data.progressRate));
    this.props.status = data.status;
    this.props.completedUnits = data.completedUnits;
    this.props.totalUnits = data.totalUnits;
    this.props.syncedAt = new Date();
  }

  toProps(): AcademicProgressProps {
    return { ...this.props };
  }
}
