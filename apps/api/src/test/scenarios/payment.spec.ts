import { describe, test, expect, afterAll } from 'vitest';
import { getApp, closeApp } from '../helpers/setup';
import { Scenario } from '../helpers/scenario';
import { loginAs } from '../steps/auth.steps';
import {
  getFirstClientId,
  createInvoice,
  registerPayment,
} from '../steps/payment.steps';

afterAll(async () => {
  await closeApp();
});

describe('Payments', () => {
  test('Create invoice → register payment', async () => {
    const app = await getApp();
    const s = new Scenario('Payment: create invoice + pay');

    const accountantToken = await s.step('Login as accountant', () =>
      loginAs(app, 'accountant@hassad.com', 'password123'),
    );

    const clientId = await s.step('Get test client ID', () =>
      getFirstClientId(),
    );

    const invoice = await s.step('Create invoice → DUE', () =>
      createInvoice(app, accountantToken.accessToken, {
        clientId,
        amount: 15000,
        paymentMethod: 'BANK_TRANSFER',
        issueDate: '2026-07-01',
        dueDate: '2026-07-31',
      }),
    );
    expect(invoice.amount).toBe(15000);
    expect(invoice.status).toBe('DUE');

    const payment = await s.step('Register full payment → PAID', () =>
      registerPayment(app, accountantToken.accessToken, invoice.id, {
        amount: 15000,
        method: 'BANK_TRANSFER',
      }),
    );
    expect(payment.status).toBe('SUCCESS');

    s.finish();
  });

  test('Partial payment → PARTIAL status', async () => {
    const app = await getApp();
    const s = new Scenario('Payment: partial payment');

    const accountantToken = await s.step('Login as accountant', () =>
      loginAs(app, 'accountant@hassad.com', 'password123'),
    );

    const clientId = await s.step('Get test client ID', () =>
      getFirstClientId(),
    );

    const invoice = await s.step('Create invoice → DUE', () =>
      createInvoice(app, accountantToken.accessToken, {
        clientId,
        amount: 10000,
        paymentMethod: 'CASH',
        issueDate: '2026-07-01',
        dueDate: '2026-07-31',
      }),
    );

    const payment = await s.step('Register partial payment (6000)', () =>
      registerPayment(app, accountantToken.accessToken, invoice.id, {
        amount: 6000,
        method: 'CASH',
      }),
    );
    expect(payment.status).toBe('SUCCESS');

    s.finish();
  });
});
