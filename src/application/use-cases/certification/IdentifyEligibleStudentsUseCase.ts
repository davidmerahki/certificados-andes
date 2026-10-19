import { CourseConfig } from '../../../domain/entities/CourseConfig';
import { Student } from '../../../domain/entities/Student';
import { AcademicProgress } from '../../../domain/entities/AcademicProgress';
import { IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository';
import { IAcademicProgressRepository } from '../../../domain/repositories/IAcademicProgressRepository';
import { IStudentRepository } from '../../../domain/repositories/IStudentRepository';
import { ICertificationRepository } from '../../../domain/repositories/ICertificationRepository';
import { EligibilityService } from '../../../domain/services/EligibilityService';
import { defaultCycle } from '../../../domain/value-objects/CertificationIdentity';

export interface EligibleCandidate {
  student: Student;
  progress: AcademicProgress;
  course: CourseConfig;
  certificationCycle: string;
}

export class IdentifyEligibleStudentsUseCase {
  constructor(
    private readonly enrollments: IEnrollmentRepository,
    private readonly progress: IAcademicProgressRepository,
    private readonly students: IStudentRepository,
    private readonly certifications: ICertificationRepository,
    private readonly eligibility: EligibilityService,
  ) {}

  async execute(
    course: CourseConfig,
    certificationCycle = defaultCycle(),
  ): Promise<EligibleCandidate[]> {
    const enrollments = await this.enrollments.findByCourse(course.id);
    const candidates: EligibleCandidate[] = [];

    for (const enrollment of enrollments) {
      const student = await this.students.findById(enrollment.studentId);
      const progress = await this.progress.findByStudentAndCourse(
        enrollment.studentId,
        course.id,
      );
      if (!student || !progress) continue;

      const existing = await this.certifications.findByIdentity(
        student.id,
        course.id,
        certificationCycle,
      );

      const result = this.eligibility.evaluate({
        student,
        progress,
        course,
        existingCertification: existing,
      });

      if (result.eligible) {
        candidates.push({ student, progress, course, certificationCycle });
      }
    }

    return candidates;
  }
}
