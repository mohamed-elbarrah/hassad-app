import { describe, test, expect, afterAll } from 'vitest';
import { getApp, closeApp } from '../helpers/setup';
import { Scenario } from '../helpers/scenario';
import { loginAs } from '../steps/auth.steps';
import {
  getFirstProjectId,
  createTask,
  transitionTask,
} from '../steps/task.steps';

afterAll(async () => {
  await closeApp();
});

describe('Tasks', () => {
  test('Full lifecycle: TODO → DONE', async () => {
    const app = await getApp();
    const s = new Scenario('Task: full lifecycle');

    const pmToken = await s.step('Login as PM', () =>
      loginAs(app, 'pm@hassad.com', 'password123'),
    );

    const project = await s.step('Get seed project', () =>
      getFirstProjectId(),
    );

    const task = await s.step('Create task → TODO', () =>
      createTask(app, pmToken.accessToken, {
        projectId: project.id,
        dept: 'DEVELOPMENT',
        title: '[TEST] Implement login page',
        priority: 'HIGH',
        dueDate: '2026-07-31',
      }),
    );
    expect(task.status).toBe('TODO');

    const started = await s.step('Start → IN_PROGRESS', () =>
      transitionTask(app, pmToken.accessToken, task.id, 'start'),
    );
    expect(started.status).toBe('IN_PROGRESS');

    const submitted = await s.step('Submit → IN_REVIEW', () =>
      transitionTask(app, pmToken.accessToken, task.id, 'submit'),
    );
    expect(submitted.status).toBe('IN_REVIEW');

    const done = await s.step('Approve → DONE', () =>
      transitionTask(app, pmToken.accessToken, task.id, 'approve'),
    );
    expect(done.status).toBe('DONE');

    s.finish();
  });

  test('Rejection loop: IN_REVIEW → REVISION → IN_PROGRESS', async () => {
    const app = await getApp();
    const s = new Scenario('Task: revision loop');

    const pmToken = await s.step('Login as PM', () =>
      loginAs(app, 'pm@hassad.com', 'password123'),
    );

    const project = await s.step('Get seed project', () =>
      getFirstProjectId(),
    );

    const task = await s.step('Create task → TODO', () =>
      createTask(app, pmToken.accessToken, {
        projectId: project.id,
        dept: 'DESIGN',
        title: '[TEST] Design homepage',
        priority: 'NORMAL',
        dueDate: '2026-08-15',
      }),
    );

    await s.step('Start → IN_PROGRESS', () =>
      transitionTask(app, pmToken.accessToken, task.id, 'start'),
    );

    await s.step('Submit → IN_REVIEW', () =>
      transitionTask(app, pmToken.accessToken, task.id, 'submit'),
    );

    const rejected = await s.step('Reject → REVISION', () =>
      transitionTask(app, pmToken.accessToken, task.id, 'reject'),
    );
    expect(rejected.status).toBe('REVISION');

    const restarted = await s.step('Restart → IN_PROGRESS', () =>
      transitionTask(app, pmToken.accessToken, task.id, 'start'),
    );
    expect(restarted.status).toBe('IN_PROGRESS');

    s.finish();
  });
});
