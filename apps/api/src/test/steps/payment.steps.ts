import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type InvoiceData = {
  id: string;
  amount: number;
  status: string;
  clientId: string;
};

export type PaymentData = {
  id: string;
  amount: number;
  status: string;
};

export async function getFirstClientId(): Promise<string> {
  const client = await prisma.client.findFirst();
  if (!client) throw new Error('No clients found in database');
  return client.id;
}

export async function createInvoice(
  app: INestApplication,
  token: string,
  data: {
    clientId: string;
    amount: number;
    paymentMethod: string;
    issueDate: string;
    dueDate: string;
    notes?: string;
  },
): Promise<InvoiceData> {
  const res = await request(app.getHttpServer())
    .post('/v1/invoices')
    .auth(token, { type: 'bearer' })
    .send(data);

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `createInvoice failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
  return res.body.data;
}

export async function registerPayment(
  app: INestApplication,
  token: string,
  invoiceId: string,
  data: {
    amount: number;
    method: string;
    notes?: string;
  },
): Promise<PaymentData> {
  const res = await request(app.getHttpServer())
    .patch(`/v1/invoices/${invoiceId}/pay`)
    .auth(token, { type: 'bearer' })
    .send(data);

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(
      `registerPayment failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
  return res.body.data;
}
