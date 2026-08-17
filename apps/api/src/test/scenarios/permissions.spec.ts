import { describe, test, expect, afterAll } from 'vitest';
import { getApp, closeApp } from '../helpers/setup';
import { Scenario } from '../helpers/scenario';
import { loginAs } from '../steps/auth.steps';
import request from 'supertest';

afterAll(async () => {
  await closeApp();
});

describe('Permissions & Validation', () => {
  test('Employee denied finance endpoints → 403', async () => {
    const app = await getApp();
    const s = new Scenario('Permissions: employee denied finance');

    const empToken = await s.step('Login as employee', () =>
      loginAs(app, 'employee@hassad.com', 'password123'),
    );

    const res = await s.step('GET /v1/invoices', () =>
      request(app.getHttpServer())
        .get('/v1/invoices')
        .auth(empToken.accessToken, { type: 'bearer' }),
    );
    expect(res.status).toBe(403);

    s.finish();
  });

  test('Client denied tasks.create → 403', async () => {
    const app = await getApp();
    const s = new Scenario('Permissions: client denied task create');

    const clientToken = await s.step('Login as client', () =>
      loginAs(app, 'client@hassad.com', 'password123'),
    );

    const res = await s.step('POST /v1/tasks', () =>
      request(app.getHttpServer())
        .post('/v1/tasks')
        .auth(clientToken.accessToken, { type: 'bearer' })
        .send({ title: 'test' }),
    );
    expect(res.status).toBe(403);

    s.finish();
  });

  test('Unauthenticated request → 401', async () => {
    const app = await getApp();
    const s = new Scenario('Validation: no auth token');

    const res = await s.step('GET /v1/projects without token', () =>
      request(app.getHttpServer()).get('/v1/projects'),
    );
    expect(res.status).toBe(401);

    s.finish();
  });
});
