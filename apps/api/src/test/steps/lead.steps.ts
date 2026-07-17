import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export type LeadData = {
  id: string;
  companyName: string;
  pipelineStage: string;
  isActive: boolean;
};

export async function createLead(
  app: INestApplication,
  token: string,
  data: {
    companyName: string;
    contactName?: string;
    phoneWhatsapp?: string;
    businessName?: string;
    businessType?: string;
    source?: string;
    [key: string]: any;
  },
): Promise<LeadData> {
  // Fill defaults for required fields
  const defaulted = {
    contactName: data.contactName || 'Test Contact',
    phoneWhatsapp: data.phoneWhatsapp || '+966500000000',
    businessName: data.businessName || data.companyName,
    businessType: data.businessType || 'SERVICE',
    source: data.source || 'REFERRAL',
    ...data,
  };
  const res = await request(app.getHttpServer())
    .post('/v1/leads')
    .auth(token, { type: 'bearer' })
    .send(defaulted);

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`createLead failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}

export async function moveLeadStage(
  app: INestApplication,
  token: string,
  leadId: string,
  stage: string,
): Promise<void> {
  const res = await request(app.getHttpServer())
    .post(`/v1/leads/${leadId}/stage`)
    .auth(token, { type: 'bearer' })
    .send({ toStage: stage });

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `moveLeadStage failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
}

export async function moveLeadStageExpecting(
  app: INestApplication,
  token: string,
  leadId: string,
  stage: string,
): Promise<number> {
  const res = await request(app.getHttpServer())
    .post(`/v1/leads/${leadId}/stage`)
    .auth(token, { type: 'bearer' })
    .send({ toStage: stage });
  return res.status;
}

export async function getLead(
  app: INestApplication,
  token: string,
  leadId: string,
): Promise<LeadData> {
  const res = await request(app.getHttpServer())
    .get(`/v1/leads/${leadId}`)
    .auth(token, { type: 'bearer' });

  if (res.status !== 200) {
    throw new Error(`getLead failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}

export async function convertLead(
  app: INestApplication,
  token: string,
  leadId: string,
): Promise<void> {
  const res = await request(app.getHttpServer())
    .post(`/v1/leads/${leadId}/convert`)
    .auth(token, { type: 'bearer' });

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `convertLead failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
}
