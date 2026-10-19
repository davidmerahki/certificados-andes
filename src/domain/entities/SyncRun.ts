export type SyncRunStatus = 'running' | 'completed' | 'failed' | 'partial';
export type SyncRunMode = 'full' | 'simulation' | 'course';

export interface CourseSyncResult {
  courseConfigId: string;
  courseName: string;
  studentsProcessed: number;
  eligibleFound: number;
  emissionsRequested: number;
  emissionsSimulated: number;
  errors: string[];
  success: boolean;
}

export interface SyncRunProps {
  id: string;
  mode: SyncRunMode;
  status: SyncRunStatus;
  simulation: boolean;
  startedAt: Date;
  finishedAt?: Date;
  courseResults: CourseSyncResult[];
  totalEligible: number;
  totalEmitted: number;
  totalFailed: number;
  errorSummary?: string;
}

export class SyncRun {
  private constructor(private props: SyncRunProps) {}

  static start(input: {
    id: string;
    mode: SyncRunMode;
    simulation: boolean;
  }): SyncRun {
    return new SyncRun({
      id: input.id,
      mode: input.mode,
      status: 'running',
      simulation: input.simulation,
      startedAt: new Date(),
      courseResults: [],
      totalEligible: 0,
      totalEmitted: 0,
      totalFailed: 0,
    });
  }

  static reconstitute(props: SyncRunProps): SyncRun {
    return new SyncRun(props);
  }

  get id(): string {
    return this.props.id;
  }

  get mode(): SyncRunMode {
    return this.props.mode;
  }

  get status(): SyncRunStatus {
    return this.props.status;
  }

  get simulation(): boolean {
    return this.props.simulation;
  }

  get startedAt(): Date {
    return this.props.startedAt;
  }

  get finishedAt(): Date | undefined {
    return this.props.finishedAt;
  }

  get courseResults(): CourseSyncResult[] {
    return [...this.props.courseResults];
  }

  get totalEligible(): number {
    return this.props.totalEligible;
  }

  get totalEmitted(): number {
    return this.props.totalEmitted;
  }

  get totalFailed(): number {
    return this.props.totalFailed;
  }

  get errorSummary(): string | undefined {
    return this.props.errorSummary;
  }

  addCourseResult(result: CourseSyncResult): void {
    this.props.courseResults.push(result);
    this.props.totalEligible += result.eligibleFound;
    this.props.totalEmitted +=
      result.emissionsRequested + result.emissionsSimulated;
    this.props.totalFailed += result.errors.length;
  }

  complete(): void {
    const anyFailure = this.props.courseResults.some((r) => !r.success);
    const anySuccess = this.props.courseResults.some((r) => r.success);
    if (anyFailure && anySuccess) {
      this.props.status = 'partial';
    } else if (anyFailure) {
      this.props.status = 'failed';
    } else {
      this.props.status = 'completed';
    }
    this.props.finishedAt = new Date();
  }

  fail(message: string): void {
    this.props.status = 'failed';
    this.props.errorSummary = message;
    this.props.finishedAt = new Date();
  }

  toProps(): SyncRunProps {
    return {
      ...this.props,
      courseResults: this.props.courseResults.map((r) => ({
        ...r,
        errors: [...r.errors],
      })),
    };
  }
}
