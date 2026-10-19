import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createContainer } from '../../src/infrastructure/di/container';
import { createApp } from '../../src/presentation/http/app';
import { createTestRepos } from '../helpers/InMemoryRepositories';

describe('HTTP presentation', () => {
  it('exposes health without auth', async () => {
    const deps = createTestRepos();
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
    const app = createApp(container);

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects admin routes without API key', async () => {
    const deps = createTestRepos();
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
    const app = createApp(container);

    const res = await request(app).get('/api/courses');
    expect(res.status).toBe(401);
  });

  it('registers a course via HTTP admin API', async () => {
    const deps = createTestRepos();
    deps.learnWorlds.courses.set('lw-new', { id: 'lw-new', title: 'New' });
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
    const app = createApp(container);

    const res = await request(app)
      .post('/api/courses')
      .set('x-api-key', container.config.adminApiKey)
      .send({
        learnWorldsCourseId: 'lw-new',
        name: 'New Course',
        pokTemplateId: 'tpl-x',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.learnWorldsCourseId).toBe('lw-new');
    expect(res.body.data.status).toBe('draft');
  });
});
