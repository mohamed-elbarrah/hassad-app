import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResult = {
  status: number;
  body: any;
  cookies: string[];
};

export async function loginAs(
  app: INestApplication,
  email: string,
  password: string,
): Promise<AuthTokens> {
  const res = await request(app.getHttpServer())
    .post('/v1/auth/login')
    .send({ email, password });

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`loginAs failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  const cookies = res.headers['set-cookie'] as unknown as string[];
  const refreshCookie = cookies?.find((c: string) => c.startsWith('refreshToken='));
  const refreshToken = refreshCookie
    ? refreshCookie.split(';')[0].replace('refreshToken=', '')
    : '';

  return {
    accessToken: res.body.data.accessToken,
    refreshToken,
  };
}

export async function loginExpecting(
  app: INestApplication,
  email: string,
  password: string,
): Promise<LoginResult> {
  const res = await request(app.getHttpServer())
    .post('/v1/auth/login')
    .send({ email, password });

  return {
    status: res.status,
    body: res.body,
    cookies: (res.headers['set-cookie'] as unknown as string[]) || [],
  };
}

export async function refreshTokens(
  app: INestApplication,
  refreshTokenStr: string,
): Promise<AuthTokens> {
  const res = await request(app.getHttpServer())
    .post('/v1/auth/refresh')
    .set('Cookie', `refreshToken=${refreshTokenStr}`);

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`refreshTokens failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  const cookies = res.headers['set-cookie'] as unknown as string[];
  const tokenCookie = cookies?.find((c: string) => c.startsWith('token='));
  const newToken = tokenCookie
    ? tokenCookie.split(';')[0].replace('token=', '')
    : res.body.data.accessToken;

  return {
    accessToken: newToken,
    refreshToken: refreshTokenStr,
  };
}

export async function logout(
  app: INestApplication,
  accessToken: string,
): Promise<void> {
  const res = await request(app.getHttpServer())
    .post('/v1/auth/logout')
    .auth(accessToken, { type: 'bearer' });

  if (res.status !== 200) {
    throw new Error(`logout failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
}
