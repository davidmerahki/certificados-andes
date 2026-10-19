import { Enrollment } from '../entities/Enrollment';

export interface IEnrollmentRepository {
  save(enrollment: Enrollment): Promise<Enrollment>;
  upsert(enrollment: Enrollment): Promise<Enrollment>;
  findByStudentAndCourse(
    studentId: string,
    courseConfigId: string,
  ): Promise<Enrollment | null>;
  findByCourse(
    courseConfigId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<Enrollment[]>;
  countByCourse(courseConfigId: string): Promise<number>;
}
