export interface EnrollmentProps {
  id: string;
  studentId: string;
  courseConfigId: string;
  learnWorldsCourseId: string;
  enrolledAt: Date;
  syncedAt: Date;
}

export class Enrollment {
  private constructor(private props: EnrollmentProps) {}

  static create(input: {
    id: string;
    studentId: string;
    courseConfigId: string;
    learnWorldsCourseId: string;
    enrolledAt?: Date;
  }): Enrollment {
    const now = new Date();
    return new Enrollment({
      id: input.id,
      studentId: input.studentId,
      courseConfigId: input.courseConfigId,
      learnWorldsCourseId: input.learnWorldsCourseId,
      enrolledAt: input.enrolledAt ?? now,
      syncedAt: now,
    });
  }

  static reconstitute(props: EnrollmentProps): Enrollment {
    return new Enrollment(props);
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

  get enrolledAt(): Date {
    return this.props.enrolledAt;
  }

  get syncedAt(): Date {
    return this.props.syncedAt;
  }

  touchSynced(): void {
    this.props.syncedAt = new Date();
  }

  toProps(): EnrollmentProps {
    return { ...this.props };
  }
}
