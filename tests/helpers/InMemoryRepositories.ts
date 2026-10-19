import { CourseConfig } from '../../src/domain/entities/CourseConfig';
import { Student } from '../../src/domain/entities/Student';
import { Enrollment } from '../../src/domain/entities/Enrollment';
import { AcademicProgress } from '../../src/domain/entities/AcademicProgress';
import { Certification } from '../../src/domain/entities/Certification';
import { SyncRun } from '../../src/domain/entities/SyncRun';
import { ICourseConfigRepository } from '../../src/domain/repositories/ICourseConfigRepository';
import { IStudentRepository } from '../../src/domain/repositories/IStudentRepository';
import { IEnrollmentRepository } from '../../src/domain/repositories/IEnrollmentRepository';
import { IAcademicProgressRepository } from '../../src/domain/repositories/IAcademicProgressRepository';
import { ICertificationRepository } from '../../src/domain/repositories/ICertificationRepository';
import { ISyncRunRepository } from '../../src/domain/repositories/ISyncRunRepository';
import { CourseStatus, CourseStatuses } from '../../src/domain/value-objects/CourseStatus';
import { CertificationStatus } from '../../src/domain/value-objects/CertificationStatus';
import { IDistributedLock } from '../../src/domain/ports/IDistributedLock';
import { IIdGenerator } from '../../src/domain/ports/IIdGenerator';
import { ILogger } from '../../src/domain/ports/ILogger';
import {
  ILearnWorldsClient,
  LwUser,
  LwEnrollment,
  LwProgress,
  LwCourse,
  Paginated,
} from '../../src/domain/ports/ILearnWorldsClient';
import {
  IPokClient,
  PokEmitRequest,
  PokEmitResult,
  PokCredentialStatus,
  PokTemplateSummary,
} from '../../src/domain/ports/IPokClient';
import { PokTemplateDetails } from '../../src/domain/services/TemplateCompatibilityService';

export class InMemoryCourseConfigRepository implements ICourseConfigRepository {
  private store = new Map<string, CourseConfig>();
  private certCounts = new Map<string, number>();

  async save(course: CourseConfig): Promise<CourseConfig> {
    this.store.set(course.id, CourseConfig.reconstitute(course.toProps()));
    return course;
  }

  async findById(id: string): Promise<CourseConfig | null> {
    return this.store.get(id) ?? null;
  }

  async findByLearnWorldsCourseId(id: string): Promise<CourseConfig | null> {
    return [...this.store.values()].find((c) => c.learnWorldsCourseId === id) ?? null;
  }

  async findAll(filter?: { status?: CourseStatus }): Promise<CourseConfig[]> {
    let all = [...this.store.values()];
    if (filter?.status) all = all.filter((c) => c.status === filter.status);
    return all;
  }

  async findActiveForSync(): Promise<CourseConfig[]> {
    return [...this.store.values()].filter((c) => c.isActiveForProcessing());
  }

  async existsWithCertifications(courseConfigId: string): Promise<boolean> {
    return (this.certCounts.get(courseConfigId) ?? 0) > 0;
  }

  markHasCertifications(courseConfigId: string): void {
    this.certCounts.set(courseConfigId, 1);
  }
}

export class InMemoryStudentRepository implements IStudentRepository {
  private store = new Map<string, Student>();

  async save(student: Student): Promise<Student> {
    this.store.set(student.id, Student.reconstitute(student.toProps()));
    return student;
  }

  async upsertByLearnWorldsId(student: Student): Promise<Student> {
    const existing = [...this.store.values()].find(
      (s) => s.learnWorldsUserId === student.learnWorldsUserId,
    );
    if (existing) {
      existing.applySync({
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        tags: student.tags,
      });
      return this.save(existing);
    }
    return this.save(student);
  }

  async findById(id: string): Promise<Student | null> {
    return this.store.get(id) ?? null;
  }

  async findByLearnWorldsUserId(id: string): Promise<Student | null> {
    return [...this.store.values()].find((s) => s.learnWorldsUserId === id) ?? null;
  }

  async findByIds(ids: string[]): Promise<Student[]> {
    return ids.map((id) => this.store.get(id)).filter(Boolean) as Student[];
  }

  async findAll(): Promise<Student[]> {
    return [...this.store.values()];
  }
}

export class InMemoryEnrollmentRepository implements IEnrollmentRepository {
  private store = new Map<string, Enrollment>();

  private key(studentId: string, courseConfigId: string) {
    return `${studentId}:${courseConfigId}`;
  }

  async save(enrollment: Enrollment): Promise<Enrollment> {
    this.store.set(
      this.key(enrollment.studentId, enrollment.courseConfigId),
      Enrollment.reconstitute(enrollment.toProps()),
    );
    return enrollment;
  }

  async upsert(enrollment: Enrollment): Promise<Enrollment> {
    return this.save(enrollment);
  }

  async findByStudentAndCourse(
    studentId: string,
    courseConfigId: string,
  ): Promise<Enrollment | null> {
    return this.store.get(this.key(studentId, courseConfigId)) ?? null;
  }

  async findByCourse(courseConfigId: string): Promise<Enrollment[]> {
    return [...this.store.values()].filter((e) => e.courseConfigId === courseConfigId);
  }

  async countByCourse(courseConfigId: string): Promise<number> {
    return (await this.findByCourse(courseConfigId)).length;
  }
}

export class InMemoryAcademicProgressRepository
  implements IAcademicProgressRepository
{
  private store = new Map<string, AcademicProgress>();

  private key(studentId: string, courseConfigId: string) {
    return `${studentId}:${courseConfigId}`;
  }

  async save(progress: AcademicProgress): Promise<AcademicProgress> {
    this.store.set(
      this.key(progress.studentId, progress.courseConfigId),
      AcademicProgress.reconstitute(progress.toProps()),
    );
    return progress;
  }

  async upsert(progress: AcademicProgress): Promise<AcademicProgress> {
    return this.save(progress);
  }

  async findByStudentAndCourse(
    studentId: string,
    courseConfigId: string,
  ): Promise<AcademicProgress | null> {
    return this.store.get(this.key(studentId, courseConfigId)) ?? null;
  }

  async findByCourse(courseConfigId: string): Promise<AcademicProgress[]> {
    return [...this.store.values()].filter((p) => p.courseConfigId === courseConfigId);
  }
}

export class InMemoryCertificationRepository implements ICertificationRepository {
  private store = new Map<string, Certification>();

  async save(certification: Certification): Promise<Certification> {
    this.store.set(
      certification.id,
      Certification.reconstitute(certification.toProps()),
    );
    return certification;
  }

  async tryCreate(certification: Certification): Promise<Certification | null> {
    const dup = [...this.store.values()].find(
      (c) =>
        c.studentId === certification.studentId &&
        c.courseConfigId === certification.courseConfigId &&
        c.certificationCycle === certification.certificationCycle,
    );
    if (dup) return null;
    return this.save(certification);
  }

  async findById(id: string): Promise<Certification | null> {
    return this.store.get(id) ?? null;
  }

  async findByIdentity(
    studentId: string,
    courseConfigId: string,
    certificationCycle: string,
  ): Promise<Certification | null> {
    return (
      [...this.store.values()].find(
        (c) =>
          c.studentId === studentId &&
          c.courseConfigId === courseConfigId &&
          c.certificationCycle === certificationCycle,
      ) ?? null
    );
  }

  async findByIdempotencyKey(key: string): Promise<Certification | null> {
    return [...this.store.values()].find((c) => c.idempotencyKey === key) ?? null;
  }

  async findByCourse(
    courseConfigId: string,
    filter?: { status?: CertificationStatus },
  ): Promise<Certification[]> {
    return [...this.store.values()].filter(
      (c) =>
        c.courseConfigId === courseConfigId &&
        (!filter?.status || c.status === filter.status),
    );
  }

  async findByStudent(studentId: string): Promise<Certification[]> {
    return [...this.store.values()].filter((c) => c.studentId === studentId);
  }

  async findFailed(): Promise<Certification[]> {
    return [...this.store.values()].filter((c) => c.status === 'failed');
  }

  async findHistory(options?: {
    courseConfigId?: string;
    studentId?: string;
  }): Promise<Certification[]> {
    return [...this.store.values()].filter((c) => {
      if (options?.courseConfigId && c.courseConfigId !== options.courseConfigId) {
        return false;
      }
      if (options?.studentId && c.studentId !== options.studentId) return false;
      return true;
    });
  }

  all(): Certification[] {
    return [...this.store.values()];
  }
}

export class InMemorySyncRunRepository implements ISyncRunRepository {
  private store = new Map<string, SyncRun>();

  async save(run: SyncRun): Promise<SyncRun> {
    this.store.set(run.id, SyncRun.reconstitute(run.toProps()));
    return run;
  }

  async findById(id: string): Promise<SyncRun | null> {
    return this.store.get(id) ?? null;
  }

  async findRecent(limit = 20): Promise<SyncRun[]> {
    return [...this.store.values()].slice(0, limit);
  }

  async findByCourse(courseConfigId: string): Promise<SyncRun[]> {
    return [...this.store.values()].filter((r) =>
      r.courseResults.some((c) => c.courseConfigId === courseConfigId),
    );
  }

  async findRunning(): Promise<SyncRun | null> {
    return [...this.store.values()].find((r) => r.status === 'running') ?? null;
  }
}

export class InMemoryLock implements IDistributedLock {
  private locks = new Set<string>();

  async acquire(key: string): Promise<boolean> {
    if (this.locks.has(key)) return false;
    this.locks.add(key);
    return true;
  }

  async release(key: string): Promise<void> {
    this.locks.delete(key);
  }
}

export class SequentialIdGenerator implements IIdGenerator {
  private n = 0;
  generate(): string {
    this.n += 1;
    return `id-${this.n}`;
  }
}

export class SilentLogger implements ILogger {
  info(): void {}
  warn(): void {}
  error(): void {}
  debug(): void {}
}

export class FakeLearnWorldsClient implements ILearnWorldsClient {
  users: LwUser[] = [];
  courses = new Map<string, LwCourse>();
  enrollmentsByUser = new Map<string, LwEnrollment[]>();
  progressByUser = new Map<string, LwProgress[]>();
  courseUsers = new Map<string, LwUser[]>();

  async listUsers(page = 1, itemsPerPage = 50): Promise<Paginated<LwUser>> {
    const start = (page - 1) * itemsPerPage;
    const data = this.users.slice(start, start + itemsPerPage);
    return {
      data,
      page,
      totalPages: Math.max(1, Math.ceil(this.users.length / itemsPerPage)),
      totalItems: this.users.length,
    };
  }

  async getUser(userId: string): Promise<LwUser | null> {
    return this.users.find((u) => u.id === userId) ?? null;
  }

  async getCourse(courseId: string): Promise<LwCourse | null> {
    return this.courses.get(courseId) ?? null;
  }

  async listUserEnrollments(userId: string): Promise<LwEnrollment[]> {
    return this.enrollmentsByUser.get(userId) ?? [];
  }

  async getUserProgress(userId: string): Promise<LwProgress[]> {
    return this.progressByUser.get(userId) ?? [];
  }

  async listCourseUsers(
    courseId: string,
    page = 1,
    itemsPerPage = 50,
  ): Promise<Paginated<LwUser>> {
    const all = this.courseUsers.get(courseId) ?? [];
    const start = (page - 1) * itemsPerPage;
    const data = all.slice(start, start + itemsPerPage);
    return {
      data,
      page,
      totalPages: Math.max(1, Math.ceil(all.length / itemsPerPage)),
      totalItems: all.length,
    };
  }
}

export class FakePokClient implements IPokClient {
  templates = new Map<string, PokTemplateDetails>();
  emissions: Array<PokEmitRequest & { credentialId: string }> = [];
  failForTemplate?: string;

  async listTemplates(): Promise<PokTemplateSummary[]> {
    return [...this.templates.values()].map((t) => ({ id: t.id, name: t.name }));
  }

  async getTemplate(templateId: string): Promise<PokTemplateDetails | null> {
    return this.templates.get(templateId) ?? null;
  }

  async emitCredential(request: PokEmitRequest): Promise<PokEmitResult> {
    if (this.failForTemplate && request.templateId === this.failForTemplate) {
      throw new Error(`POK API error for template ${request.templateId}`);
    }
    const credentialId = `pok-${this.emissions.length + 1}`;
    this.emissions.push({ ...request, credentialId });
    return { credentialId, state: 'pending' };
  }

  async getCredential(credentialId: string): Promise<PokCredentialStatus | null> {
    const found = this.emissions.find((e) => e.credentialId === credentialId);
    if (!found) return null;
    return { id: credentialId, state: 'minted' };
  }
}

export function createTestRepos() {
  return {
    courses: new InMemoryCourseConfigRepository(),
    students: new InMemoryStudentRepository(),
    enrollments: new InMemoryEnrollmentRepository(),
    progress: new InMemoryAcademicProgressRepository(),
    certifications: new InMemoryCertificationRepository(),
    syncRuns: new InMemorySyncRunRepository(),
    lock: new InMemoryLock(),
    ids: new SequentialIdGenerator(),
    logger: new SilentLogger(),
    learnWorlds: new FakeLearnWorldsClient(),
    pok: new FakePokClient(),
  };
}

export { CourseStatuses };
