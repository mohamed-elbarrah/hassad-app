import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type TaskData = {
  id: string;
  status: string;
  title: string;
  projectId: string;
};

export async function getFirstProjectId(): Promise<{
  id: string;
  clientId: string;
}> {
  const project = await prisma.project.findFirst();
  if (!project) throw new Error('No projects found in database');
  return { id: project.id, clientId: project.clientId };
}

export async function createTask(
  app: INestApplication,
  token: string,
  data: {
    projectId: string;
    dept: string;
    title: string;
    priority: string;
    dueDate: string;
    assignedTo?: string;
    description?: string;
  },
): Promise<TaskData> {
  const res = await request(app.getHttpServer())
    .post('/v1/tasks')
    .auth(token, { type: 'bearer' })
    .send(data);

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `createTask failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
  return res.body.data;
}

export async function transitionTask(
  app: INestApplication,
  token: string,
  taskId: string,
  action: 'start' | 'submit' | 'approve' | 'reject',
): Promise<TaskData> {
  const actionRoutes: Record<string, string> = {
    start: `/v1/tasks/${taskId}/start`,
    submit: `/v1/tasks/${taskId}/submit`,
    approve: `/v1/tasks/${taskId}/approve`,
    reject: `/v1/tasks/${taskId}/reject`,
  };

  const res = await request(app.getHttpServer())
    .post(actionRoutes[action])
    .auth(token, { type: 'bearer' });

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `transitionTask ${action} failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
  return res.body.data;
}
