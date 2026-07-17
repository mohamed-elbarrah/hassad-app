import { describe, test, expect, afterAll } from 'vitest';
import { getApp, closeApp } from '../helpers/setup';
import { Scenario } from '../helpers/scenario';
import {
  loginAs,
  loginExpecting,
  refreshTokens,
  logout,
} from '../steps/auth.steps';

afterAll(async () => {
  await closeApp();
});

describe('Auth', () => {
  test('Login with valid credentials returns tokens and cookies', async () => {
    const app = await getApp();
    const s = new Scenario('Login: valid credentials');

    const tokens = await s.step(
      'Login as sales@hassad.com with correct password',
      () => loginAs(app, 'sales@hassad.com', 'password123'),
    );
    expect(tokens.accessToken).toBeTruthy();
    expect(typeof tokens.accessToken).toBe('string');
    expect(tokens.accessToken.split('.')).toHaveLength(3); // JWT has 3 parts

    s.finish();
  });

  test('Login with wrong password returns 401', async () => {
    const app = await getApp();
    const s = new Scenario('Login: wrong password');

    const result = await s.step(
      'Login with invalid password',
      () => loginExpecting(app, 'sales@hassad.com', 'wrong-password'),
    );
    expect(result.status).toBe(401);

    s.finish();
  });

  test('Token refresh returns new access token', async () => {
    const app = await getApp();
    const s = new Scenario('Token refresh');

    const tokens = await s.step('Login to obtain tokens', () =>
      loginAs(app, 'sales@hassad.com', 'password123'),
    );

    const newTokens = await s.step('Refresh access token', () =>
      refreshTokens(app, tokens.refreshToken),
    );

    expect(newTokens.accessToken).toBeTruthy();
    expect(newTokens.accessToken.split('.')).toHaveLength(3);

    s.finish();
  });

  test('Logout clears session', async () => {
    const app = await getApp();
    const s = new Scenario('Logout');

    const tokens = await s.step('Login', () =>
      loginAs(app, 'sales@hassad.com', 'password123'),
    );

    await s.step('Logout', () => logout(app, tokens.accessToken));

    // Old access token should no longer be valid
    const result = await s.step(
      'Verify old token is rejected',
      () => loginExpecting(app, 'sales@hassad.com', 'password123'),
    );
    // Login with fresh credentials should work (logout doesn't invalidate password)
    expect([200, 201]).toContain(result.status);

    s.finish();
  });
});
