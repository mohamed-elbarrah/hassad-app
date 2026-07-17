import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export type RequestData = {
  id: string;
  status: string;
  companyName: string;
};

export async function createRequest(
  app: INestApplication,
  token: string,
  data: {
    companyName: string;
    contactName: string;
    phoneWhatsapp: string;
    businessName: string;
    businessType: string;
    source: string;
    notes?: string;
  },
): Promise<RequestData> {
  const res = await request(app.getHttpServer())
    .post('/v1/requests')
    .auth(token, { type: 'bearer' })
    .send(data);

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `createRequest failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
  return res.body.data;
}

export async function transitionRequest(
  app: INestApplication,
  token: string,
  requestId: string,
  toStatus: string,
): Promise<void> {
  const res = await request(app.getHttpServer())
    .post(`/v1/requests/${requestId}/status`)
    .auth(token, { type: 'bearer' })
    .send({ toStatus });

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `transitionRequest failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
}

export async function transitionRequestExpecting(
  app: INestApplication,
  token: string,
  requestId: string,
  toStatus: string,
): Promise<number> {
  const res = await request(app.getHttpServer())
    .post(`/v1/requests/${requestId}/status`)
    .auth(token, { type: 'bearer' })
    .send({ toStatus });
  return res.status;
}
