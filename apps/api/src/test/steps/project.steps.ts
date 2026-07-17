import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type ProjectData = {
  id: string;
  name: string;
  status: string;
  clientId: string;
};

export async function getFirstClientId(): Promise<string> {
  const client = await prisma.client.findFirst();
  if (!client) throw new Error('No clients found');
  return client.id;
}

export async function createProject(
  app: INestApplication,
  token: string,
  data: {
    clientId: string;
    name: string;
    status: string;
    priority: string;
    startDate: string;
    endDate: string;
    description?: string;
  },
): Promise<ProjectData> {
  const res = await request(app.getHttpServer())
    .post('/v1/projects')
    .auth(token, { type: 'bearer' })
    .send(data);

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `createProject failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
  return res.body.data;
}
