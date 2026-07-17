import { describe, test, expect, afterAll } from 'vitest';
import { getApp, closeApp } from '../helpers/setup';
import request from 'supertest';

afterAll(async () => {
  await closeApp();
});

describe('Smoke Test', () => {
  test('App boots and health endpoint responds', async () => {
    const app = await getApp();
    const res = await request(app.getHttpServer()).get('/v1/health/live');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });
});
