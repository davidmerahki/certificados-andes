import { Certification } from '../../../domain/entities/Certification';
import { ICourseConfigRepository } from '../../../domain/repositories/ICourseConfigRepository';
import { NotFoundError, ValidationError } from '../../../domain/errors/DomainError';
import { EnsureStudentFromLearnWorldsUseCase } from './EnsureStudentFromLearnWorldsUseCase';
import { EmitCredentialUseCase } from './EmitCredentialUseCase';

export interface EmitCredentialByEmailInput {
  email: string;
  courseConfigId?: string;
  learnWorldsCourseId?: string;
  certificationCycle?: string;
  simulation?: boolean;
}

export class EmitCredentialByEmailUseCase {
  constructor(
    private readonly ensureStudent: EnsureStudentFromLearnWorldsUseCase,
    private readonly emitCredential: EmitCredentialUseCase,
    private readonly courses: ICourseConfigRepository,
  ) {}

  async execute(input: EmitCredentialByEmailInput): Promise<Certification> {
    if (!input.email?.includes('@')) {
      throw new ValidationError('Valid email is required');
    }

    let course = input.courseConfigId
      ? await this.courses.findById(input.courseConfigId)
      : null;

    if (!course && input.learnWorldsCourseId) {
      course = await this.courses.findByLearnWorldsCourseId(
        input.learnWorldsCourseId,
      );
    }

    if (!course) {
      const active = await this.courses.findActiveForSync();
      course = active[0] ?? null;
    }

    if (!course) {
      throw new NotFoundError('CourseConfig');
    }

    const student = await this.ensureStudent.execute(input.email);

    return this.emitCredential.execute({
      studentId: student.id,
      courseConfigId: course.id,
      certificationCycle: input.certificationCycle,
      simulation: input.simulation,
    });
  }
}
