import { describe, test, expect, afterAll } from 'vitest';
import { getApp, closeApp } from '../helpers/setup';
import { Scenario } from '../helpers/scenario';
import { loginAs } from '../steps/auth.steps';
import { getFirstProjectId } from '../steps/task.steps';
import request from 'supertest';

afterAll(async () => {
  await closeApp();
});

describe('Projects', () => {
  test('Read and list seed projects', async () => {
    const app = await getApp();
    const s = new Scenario('Project: read list');

    const pmToken = await s.step('Login as PM', () =>
      loginAs(app, 'pm@hassad.com', 'password123'),
    );

    const res = await s.step('List projects', async () => {
      const r = await request(app.getHttpServer())
        .get('/v1/projects')
        .auth(pmToken.accessToken, { type: 'bearer' });
      return r;
    });
    expect(res.status).toBe(200);
    const projects = res.body.data.items || res.body.data;
    expect(Array.isArray(projects)).toBe(true);

    const project = await s.step('Get seed project data', () =>
      getFirstProjectId(),
    );

    const getRes = await s.step('Get single project by ID', async () => {
      const r = await request(app.getHttpServer())
        .get(`/v1/projects/${project.id}`)
        .auth(pmToken.accessToken, { type: 'bearer' });
      return r;
    });
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(project.id);

    s.finish();
  });
});
