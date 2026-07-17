import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export type ContractData = {
  id: string;
  status: string;
  shareLinkToken: string;
  title: string;
};

export async function createContract(
  app: INestApplication,
  token: string,
  data: {
    requestId: string;
    title: string;
    type: string;
    totalValue?: number;
    downPaymentType?: string;
    downPaymentValue?: number;
    paymentPlan?: unknown[];
  },
): Promise<ContractData> {
  const req = request(app.getHttpServer())
    .post('/v1/contracts')
    .auth(token, { type: 'bearer' })
    .field('requestId', data.requestId)
    .field('title', data.title)
    .field('type', data.type);

  if (data.totalValue != null) {
    req.field('totalValue', String(data.totalValue));
  }
  if (data.downPaymentType) {
    req.field('downPaymentType', data.downPaymentType);
  }
  if (data.downPaymentValue != null) {
    req.field('downPaymentValue', String(data.downPaymentValue));
  }

  const res = await req.attach(
    'file',
    Buffer.from('fake contract pdf'),
    'contract.pdf',
  );

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `createContract failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
  return res.body.data;
}

export async function signContractByToken(
  app: INestApplication,
  shareToken: string,
  userToken: string,
  signedByName: string,
): Promise<{ id: string; status: string }> {
  const res = await request(app.getHttpServer())
    .post(`/v1/contracts/share/${shareToken}/sign`)
    .auth(userToken, { type: 'bearer' })
    .send({ signedByName });

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `signContractByToken failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
  return res.body.data;
}

export async function activateContract(
  app: INestApplication,
  token: string,
  contractId: string,
): Promise<{ id: string; status: string }> {
  const res = await request(app.getHttpServer())
    .post(`/v1/contracts/${contractId}/activate`)
    .auth(token, { type: 'bearer' })
    .send();

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `activateContract failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
  return res.body.data;
}
