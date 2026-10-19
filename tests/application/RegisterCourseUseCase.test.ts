import { describe, it, expect, beforeEach } from 'vitest';
import { RegisterCourseUseCase } from '../../src/application/use-cases/courses/RegisterCourseUseCase';
import { createTestRepos } from '../helpers/InMemoryRepositories';

describe('RegisterCourseUseCase', () => {
  let deps: ReturnType<typeof createTestRepos>;
  let useCase: RegisterCourseUseCase;

  beforeEach(() => {
    deps = createTestRepos();
    deps.learnWorlds.courses.set('lw-js-101', {
      id: 'lw-js-101',
      title: 'JS 101',
    });
    useCase = new RegisterCourseUseCase(deps.courses, deps.ids, deps.learnWorlds);
  });

  it('registers a course from configuration without code changes', async () => {
    const course = await useCase.execute({
      learnWorldsCourseId: 'lw-js-101',
      name: 'JavaScript 101',
      pokTemplateId: 'tpl-js',
    });

    expect(course.learnWorldsCourseId).toBe('lw-js-101');
    expect(course.status).toBe('draft');
    expect(course.pokTemplateId).toBe('tpl-js');
  });

  it('rejects duplicate LearnWorlds course ids', async () => {
    await useCase.execute({
      learnWorldsCourseId: 'lw-js-101',
      name: 'JavaScript 101',
      validateRemote: false,
    });

    await expect(
      useCase.execute({
        learnWorldsCourseId: 'lw-js-101',
        name: 'Duplicate',
        validateRemote: false,
      }),
    ).rejects.toThrow(/already registered/);
  });
});
