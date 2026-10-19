/**
 * Acceptance demo: two courses with different POK templates,
 * same student enrolled in both, emissions routed to the correct template.
 * Runs entirely with in-memory fakes — no real credentials required.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createContainer } from '../../src/infrastructure/di/container';
import { loadConfig } from '../../src/infrastructure/config/env';
import {
  createTestRepos,
  CourseStatuses,
} from '../helpers/InMemoryRepositories';
import { CourseConfig } from '../../src/domain/entities/CourseConfig';
import { Student } from '../../src/domain/entities/Student';
import { Enrollment } from '../../src/domain/entities/Enrollment';
import { AcademicProgress } from '../../src/domain/entities/AcademicProgress';

describe('Multi-course certification (acceptance)', () => {
  let deps: ReturnType<typeof createTestRepos>;

  beforeEach(() => {
    deps = createTestRepos();

    deps.pok.templates.set('tpl-frontend', {
      id: 'tpl-frontend',
      name: 'Frontend Certificate',
      fields: [
        { id: 'email', label: 'email', required: true },
        { id: 'firstName', label: 'firstName', required: true },
        { id: 'lastName', label: 'lastName', required: true },
      ],
    });
    deps.pok.templates.set('tpl-backend', {
      id: 'tpl-backend',
      name: 'Backend Certificate',
      fields: [
        { id: 'email', label: 'email', required: true },
        { id: 'firstName', label: 'firstName', required: true },
        { id: 'lastName', label: 'lastName', required: true },
      ],
    });

    deps.learnWorlds.courses.set('lw-frontend', {
      id: 'lw-frontend',
      title: 'Frontend Mastery',
    });
    deps.learnWorlds.courses.set('lw-backend', {
      id: 'lw-backend',
      title: 'Backend Mastery',
    });
  });

  it('emits each course to its own POK template for the same student', async () => {
    const frontend = CourseConfig.create({
      id: 'cfg-frontend',
      learnWorldsCourseId: 'lw-frontend',
      name: 'Frontend Mastery',
      pokTemplateId: 'tpl-frontend',
      emitterOrganization: 'Academia FE',
    });
    frontend.activate();

    const backend = CourseConfig.create({
      id: 'cfg-backend',
      learnWorldsCourseId: 'lw-backend',
      name: 'Backend Mastery',
      pokTemplateId: 'tpl-backend',
      emitterOrganization: 'Academia BE',
    });
    backend.activate();

    await deps.courses.save(frontend);
    await deps.courses.save(backend);

    const student = Student.create({
      id: 'stu-multi',
      learnWorldsUserId: 'lw-user-1',
      email: 'multi@example.com',
      firstName: 'Multi',
      lastName: 'Course',
    });
    await deps.students.save(student);

    for (const course of [frontend, backend]) {
      await deps.enrollments.save(
        Enrollment.create({
          id: `enr-${course.id}`,
          studentId: student.id,
          courseConfigId: course.id,
          learnWorldsCourseId: course.learnWorldsCourseId,
        }),
      );
      await deps.progress.save(
        AcademicProgress.create({
          id: `prog-${course.id}`,
          studentId: student.id,
          courseConfigId: course.id,
          learnWorldsCourseId: course.learnWorldsCourseId,
          progressRate: 100,
          status: 'completed',
          completedUnits: 20,
          totalUnits: 20,
        }),
      );
    }

    // Seed LearnWorlds so sync enrollments path is consistent
    deps.learnWorlds.users = [
      {
        id: 'lw-user-1',
        email: 'multi@example.com',
        firstName: 'Multi',
        lastName: 'Course',
      },
    ];
    deps.learnWorlds.courseUsers.set('lw-frontend', deps.learnWorlds.users);
    deps.learnWorlds.courseUsers.set('lw-backend', deps.learnWorlds.users);
    deps.learnWorlds.progressByUser.set('lw-user-1', [
      {
        courseId: 'lw-frontend',
        userId: 'lw-user-1',
        progressRate: 100,
        status: 'completed',
        completedUnits: 20,
        totalUnits: 20,
      },
      {
        courseId: 'lw-backend',
        userId: 'lw-user-1',
        progressRate: 100,
        status: 'completed',
        completedUnits: 20,
        totalUnits: 20,
      },
    ]);

    const container = createContainer({
      config: { ...loadConfig(), sync: { ...loadConfig().sync, simulationMode: false } },
      courses: deps.courses,
      students: deps.students,
      enrollments: deps.enrollments,
      progress: deps.progress,
      certifications: deps.certifications,
      syncRuns: deps.syncRuns,
      lock: deps.lock,
      ids: deps.ids,
      logger: deps.logger,
      learnWorlds: deps.learnWorlds,
      pok: deps.pok,
    });

    const run = await container.useCases.runSynchronization.execute({
      simulation: false,
      syncStudents: true,
    });

    expect(run.status).toBe('completed');
    expect(run.courseResults).toHaveLength(2);

    const emissions = deps.pok.emissions;
    expect(emissions).toHaveLength(2);

    const templates = emissions.map((e) => e.templateId).sort();
    expect(templates).toEqual(['tpl-backend', 'tpl-frontend']);

    const certs = deps.certifications.all();
    expect(certs).toHaveLength(2);
    expect(certs.every((c) => c.status === 'emitted')).toBe(true);
    expect(certs.map((c) => c.courseConfigId).sort()).toEqual([
      'cfg-backend',
      'cfg-frontend',
    ]);

    // Same student, different courses → not duplicates
    expect(new Set(certs.map((c) => c.idempotencyKey)).size).toBe(2);
  });

  it('skips inactive course while processing active ones', async () => {
    const active = CourseConfig.create({
      id: 'cfg-active',
      learnWorldsCourseId: 'lw-frontend',
      name: 'Active',
      pokTemplateId: 'tpl-frontend',
    });
    active.activate();

    const inactive = CourseConfig.create({
      id: 'cfg-inactive',
      learnWorldsCourseId: 'lw-backend',
      name: 'Inactive',
      pokTemplateId: 'tpl-backend',
    });
    // leave as draft / deactivate
    inactive.deactivate();

    await deps.courses.save(active);
    await deps.courses.save(inactive);

    const student = Student.create({
      id: 'stu-1',
      learnWorldsUserId: 'lw-user-1',
      email: 'a@example.com',
      firstName: 'A',
      lastName: 'B',
    });
    await deps.students.save(student);

    await deps.enrollments.save(
      Enrollment.create({
        id: 'enr-1',
        studentId: student.id,
        courseConfigId: active.id,
        learnWorldsCourseId: active.learnWorldsCourseId,
      }),
    );
    await deps.progress.save(
      AcademicProgress.create({
        id: 'prog-1',
        studentId: student.id,
        courseConfigId: active.id,
        learnWorldsCourseId: active.learnWorldsCourseId,
        progressRate: 100,
        status: 'completed',
        completedUnits: 1,
        totalUnits: 1,
      }),
    );

    deps.learnWorlds.users = [
      { id: 'lw-user-1', email: 'a@example.com', firstName: 'A', lastName: 'B' },
    ];
    deps.learnWorlds.courseUsers.set('lw-frontend', deps.learnWorlds.users);
    deps.learnWorlds.progressByUser.set('lw-user-1', [
      {
        courseId: 'lw-frontend',
        userId: 'lw-user-1',
        progressRate: 100,
        status: 'completed',
        completedUnits: 1,
        totalUnits: 1,
      },
    ]);

    const container = createContainer({
      courses: deps.courses,
      students: deps.students,
      enrollments: deps.enrollments,
      progress: deps.progress,
      certifications: deps.certifications,
      syncRuns: deps.syncRuns,
      lock: deps.lock,
      ids: deps.ids,
      logger: deps.logger,
      learnWorlds: deps.learnWorlds,
      pok: deps.pok,
    });

    const run = await container.useCases.runSynchronization.execute({
      simulation: false,
      syncStudents: false,
    });

    expect(run.courseResults.map((r) => r.courseConfigId)).toEqual(['cfg-active']);
    expect(deps.pok.emissions).toHaveLength(1);
    expect(deps.pok.emissions[0].templateId).toBe('tpl-frontend');
  });

  it('isolates API failure of one course from others', async () => {
    const ok = CourseConfig.create({
      id: 'cfg-ok',
      learnWorldsCourseId: 'lw-frontend',
      name: 'OK Course',
      pokTemplateId: 'tpl-frontend',
    });
    ok.activate();

    const failing = CourseConfig.create({
      id: 'cfg-fail',
      learnWorldsCourseId: 'lw-backend',
      name: 'Failing Course',
      pokTemplateId: 'tpl-backend',
    });
    failing.activate();
    deps.pok.failForTemplate = 'tpl-backend';

    await deps.courses.save(ok);
    await deps.courses.save(failing);

    const student = Student.create({
      id: 'stu-1',
      learnWorldsUserId: 'lw-u',
      email: 'x@example.com',
      firstName: 'X',
      lastName: 'Y',
    });
    await deps.students.save(student);

    for (const course of [ok, failing]) {
      await deps.enrollments.save(
        Enrollment.create({
          id: `e-${course.id}`,
          studentId: student.id,
          courseConfigId: course.id,
          learnWorldsCourseId: course.learnWorldsCourseId,
        }),
      );
      await deps.progress.save(
        AcademicProgress.create({
          id: `p-${course.id}`,
          studentId: student.id,
          courseConfigId: course.id,
          learnWorldsCourseId: course.learnWorldsCourseId,
          progressRate: 100,
          status: 'completed',
          completedUnits: 1,
          totalUnits: 1,
        }),
      );
    }

    deps.learnWorlds.users = [
      { id: 'lw-u', email: 'x@example.com', firstName: 'X', lastName: 'Y' },
    ];
    deps.learnWorlds.courseUsers.set('lw-frontend', deps.learnWorlds.users);
    deps.learnWorlds.courseUsers.set('lw-backend', deps.learnWorlds.users);
    deps.learnWorlds.progressByUser.set('lw-u', [
      {
        courseId: 'lw-frontend',
        userId: 'lw-u',
        progressRate: 100,
        status: 'completed',
        completedUnits: 1,
        totalUnits: 1,
      },
      {
        courseId: 'lw-backend',
        userId: 'lw-u',
        progressRate: 100,
        status: 'completed',
        completedUnits: 1,
        totalUnits: 1,
      },
    ]);

    const container = createContainer({
      courses: deps.courses,
      students: deps.students,
      enrollments: deps.enrollments,
      progress: deps.progress,
      certifications: deps.certifications,
      syncRuns: deps.syncRuns,
      lock: deps.lock,
      ids: deps.ids,
      logger: deps.logger,
      learnWorlds: deps.learnWorlds,
      pok: deps.pok,
    });

    const run = await container.useCases.runSynchronization.execute({
      simulation: false,
      syncStudents: false,
      concurrency: 1,
    });

    expect(run.status).toBe('partial');
    expect(deps.pok.emissions.some((e) => e.templateId === 'tpl-frontend')).toBe(
      true,
    );
  });

  it('prevents duplicate emission on second sync for same cycle', async () => {
    const course = CourseConfig.create({
      id: 'cfg-1',
      learnWorldsCourseId: 'lw-frontend',
      name: 'Course',
      pokTemplateId: 'tpl-frontend',
    });
    course.activate();
    await deps.courses.save(course);

    const student = Student.create({
      id: 'stu-1',
      learnWorldsUserId: 'lw-u',
      email: 'd@example.com',
      firstName: 'D',
      lastName: 'U',
    });
    await deps.students.save(student);
    await deps.enrollments.save(
      Enrollment.create({
        id: 'e1',
        studentId: student.id,
        courseConfigId: course.id,
        learnWorldsCourseId: course.learnWorldsCourseId,
      }),
    );
    await deps.progress.save(
      AcademicProgress.create({
        id: 'p1',
        studentId: student.id,
        courseConfigId: course.id,
        learnWorldsCourseId: course.learnWorldsCourseId,
        progressRate: 100,
        status: 'completed',
        completedUnits: 1,
        totalUnits: 1,
      }),
    );

    deps.learnWorlds.users = [
      { id: 'lw-u', email: 'd@example.com', firstName: 'D', lastName: 'U' },
    ];
    deps.learnWorlds.courseUsers.set('lw-frontend', deps.learnWorlds.users);
    deps.learnWorlds.progressByUser.set('lw-u', [
      {
        courseId: 'lw-frontend',
        userId: 'lw-u',
        progressRate: 100,
        status: 'completed',
        completedUnits: 1,
        totalUnits: 1,
      },
    ]);

    const container = createContainer({
      courses: deps.courses,
      students: deps.students,
      enrollments: deps.enrollments,
      progress: deps.progress,
      certifications: deps.certifications,
      syncRuns: deps.syncRuns,
      lock: deps.lock,
      ids: deps.ids,
      logger: deps.logger,
      learnWorlds: deps.learnWorlds,
      pok: deps.pok,
    });

    await container.useCases.runSynchronization.execute({
      simulation: false,
      syncStudents: false,
    });
    expect(deps.pok.emissions).toHaveLength(1);

    // New lock instance for second run
    deps.lock = new (await import('../helpers/InMemoryRepositories')).InMemoryLock();
    const container2 = createContainer({
      courses: deps.courses,
      students: deps.students,
      enrollments: deps.enrollments,
      progress: deps.progress,
      certifications: deps.certifications,
      syncRuns: deps.syncRuns,
      lock: deps.lock,
      ids: deps.ids,
      logger: deps.logger,
      learnWorlds: deps.learnWorlds,
      pok: deps.pok,
    });

    await container2.useCases.runSynchronization.execute({
      simulation: false,
      syncStudents: false,
    });
    expect(deps.pok.emissions).toHaveLength(1);
  });
});
