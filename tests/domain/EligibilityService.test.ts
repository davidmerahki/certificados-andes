import { describe, it, expect } from 'vitest';
import { EligibilityService } from '../../src/domain/services/EligibilityService';
import { Student } from '../../src/domain/entities/Student';
import { AcademicProgress } from '../../src/domain/entities/AcademicProgress';
import { CourseConfig } from '../../src/domain/entities/CourseConfig';
import { Certification } from '../../src/domain/entities/Certification';
import { CourseStatuses } from '../../src/domain/value-objects/CourseStatus';

describe('EligibilityService', () => {
  const service = new EligibilityService();

  function makeCourse(overrides?: Partial<{ status: string; template: string }>) {
    const course = CourseConfig.create({
      id: 'course-1',
      learnWorldsCourseId: 'lw-course-1',
      name: 'Test Course',
      pokTemplateId: overrides?.template ?? 'tpl-1',
    });
    if (overrides?.status === 'active' || !overrides?.status) {
      course.activate();
    }
    return course;
  }

  function makeStudent() {
    return Student.create({
      id: 'stu-1',
      learnWorldsUserId: 'lw-1',
      email: 'ana@example.com',
      firstName: 'Ana',
      lastName: 'Pérez',
    });
  }

  function makeProgress(rate: number, status: 'completed' | 'in_progress') {
    return AcademicProgress.create({
      id: 'prog-1',
      studentId: 'stu-1',
      courseConfigId: 'course-1',
      learnWorldsCourseId: 'lw-course-1',
      progressRate: rate,
      status,
      completedUnits: rate === 100 ? 10 : 5,
      totalUnits: 10,
    });
  }

  it('marks student eligible when completed and course active', () => {
    const result = service.evaluate({
      student: makeStudent(),
      progress: makeProgress(100, 'completed'),
      course: makeCourse(),
    });
    expect(result.eligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('rejects incomplete progress', () => {
    const result = service.evaluate({
      student: makeStudent(),
      progress: makeProgress(80, 'in_progress'),
      course: makeCourse(),
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes('Progress'))).toBe(true);
  });

  it('rejects when certification already emitted', () => {
    const existing = Certification.createEligible({
      id: 'cert-1',
      studentId: 'stu-1',
      courseConfigId: 'course-1',
      learnWorldsCourseId: 'lw-course-1',
      certificationCycle: 'default',
      pokTemplateId: 'tpl-1',
      configVersionAtEmission: 1,
    });
    existing.markPendingEmission();
    existing.markEmitted('pok-1');

    const result = service.evaluate({
      student: makeStudent(),
      progress: makeProgress(100, 'completed'),
      course: makeCourse(),
      existingCertification: existing,
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes('already emitted'))).toBe(true);
  });

  it('rejects course without template', () => {
    const course = CourseConfig.create({
      id: 'course-1',
      learnWorldsCourseId: 'lw-course-1',
      name: 'No Template',
    });
    // force active without template via reconstitute
    const active = CourseConfig.reconstitute({
      ...course.toProps(),
      status: CourseStatuses.ACTIVE,
      syncConfig: { includeInNightlySync: true },
    });

    const result = service.evaluate({
      student: makeStudent(),
      progress: makeProgress(100, 'completed'),
      course: active,
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes('template'))).toBe(true);
  });
});
