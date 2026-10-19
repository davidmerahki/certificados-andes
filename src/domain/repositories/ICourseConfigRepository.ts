import { CourseConfig } from '../entities/CourseConfig';
import { CourseStatus } from '../value-objects/CourseStatus';

export interface ICourseConfigRepository {
  save(course: CourseConfig): Promise<CourseConfig>;
  findById(id: string): Promise<CourseConfig | null>;
  findByLearnWorldsCourseId(learnWorldsCourseId: string): Promise<CourseConfig | null>;
  findAll(filter?: { status?: CourseStatus }): Promise<CourseConfig[]>;
  findActiveForSync(): Promise<CourseConfig[]>;
  existsWithCertifications(courseConfigId: string): Promise<boolean>;
}
