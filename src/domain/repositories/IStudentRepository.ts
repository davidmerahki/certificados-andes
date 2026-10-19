import { Student } from '../entities/Student';

export interface IStudentRepository {
  save(student: Student): Promise<Student>;
  upsertByLearnWorldsId(student: Student): Promise<Student>;
  findById(id: string): Promise<Student | null>;
  findByLearnWorldsUserId(learnWorldsUserId: string): Promise<Student | null>;
  findByEmail(email: string): Promise<Student | null>;
  findByIds(ids: string[]): Promise<Student[]>;
  findAll(options?: { limit?: number; offset?: number }): Promise<Student[]>;
}
