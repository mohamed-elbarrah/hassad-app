import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export type ProposalData = {
  id: string;
  status: string;
  shareLinkToken: string;
  title: string;
};

export async function createProposal(
  app: INestApplication,
  token: string,
  data: {
    requestId: string;
    title: string;
    serviceDescription?: string;
    totalPrice?: number;
  },
): Promise<ProposalData> {
  const res = await request(app.getHttpServer())
    .post('/v1/proposals')
    .auth(token, { type: 'bearer' })
    .field('requestId', data.requestId)
    .field('title', data.title)
    .field('serviceDescription', data.serviceDescription || 'Test proposal')
    .field('totalPrice', String(data.totalPrice || 50000))
    .attach('file', Buffer.from('fake pdf content'), 'proposal.pdf');

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `createProposal failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
  return res.body.data;
}

export async function approveProposalByToken(
  app: INestApplication,
  shareToken: string,
  userToken: string,
): Promise<{ id: string; status: string }> {
  const res = await request(app.getHttpServer())
    .post(`/v1/proposals/share/${shareToken}/approve`)
    .auth(userToken, { type: 'bearer' })
    .send({});

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `approveProposalByToken failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
  return res.body.data;
}

export async function revisionProposalByToken(
  app: INestApplication,
  shareToken: string,
  userToken: string,
): Promise<{ id: string; status: string }> {
  const res = await request(app.getHttpServer())
    .post(`/v1/proposals/share/${shareToken}/revision`)
    .auth(userToken, { type: 'bearer' })
    .send({ notes: 'Please revise and resubmit' });

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `revisionProposalByToken failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
  return res.body.data;
}
