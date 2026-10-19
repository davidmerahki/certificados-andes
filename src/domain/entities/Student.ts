export interface StudentProps {
  id: string;
  learnWorldsUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  tags: string[];
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Student {
  private constructor(private props: StudentProps) {}

  static create(input: {
    id: string;
    learnWorldsUserId: string;
    email: string;
    firstName: string;
    lastName: string;
    tags?: string[];
  }): Student {
    const now = new Date();
    return new Student({
      id: input.id,
      learnWorldsUserId: input.learnWorldsUserId,
      email: input.email.toLowerCase().trim(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      tags: input.tags ?? [],
      syncedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: StudentProps): Student {
    return new Student(props);
  }

  get id(): string {
    return this.props.id;
  }

  get learnWorldsUserId(): string {
    return this.props.learnWorldsUserId;
  }

  get email(): string {
    return this.props.email;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`.trim();
  }

  get tags(): string[] {
    return [...this.props.tags];
  }

  get syncedAt(): Date {
    return this.props.syncedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  applySync(data: {
    email: string;
    firstName: string;
    lastName: string;
    tags?: string[];
  }): void {
    this.props.email = data.email.toLowerCase().trim();
    this.props.firstName = data.firstName.trim();
    this.props.lastName = data.lastName.trim();
    if (data.tags) this.props.tags = data.tags;
    this.props.syncedAt = new Date();
    this.props.updatedAt = new Date();
  }

  toProps(): StudentProps {
    return { ...this.props, tags: [...this.props.tags] };
  }
}
