import { AcademicProgress } from '../entities/AcademicProgress';

export interface IAcademicProgressRepository {
  save(progress: AcademicProgress): Promise<AcademicProgress>;
  upsert(progress: AcademicProgress): Promise<AcademicProgress>;
  findByStudentAndCourse(
    studentId: string,
    courseConfigId: string,
  ): Promise<AcademicProgress | null>;
  findByCourse(courseConfigId: string): Promise<AcademicProgress[]>;
}
