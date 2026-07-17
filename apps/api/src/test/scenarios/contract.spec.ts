import { describe, test, expect, afterAll } from 'vitest';
import { getApp, closeApp } from '../helpers/setup';
import { Scenario } from '../helpers/scenario';
import { loginAs } from '../steps/auth.steps';
import { createRequest, transitionRequest } from '../steps/request.steps';
import {
  createContract,
  signContractByToken,
} from '../steps/contract.steps';

afterAll(async () => {
  await closeApp();
});

describe('Contracts', () => {
  test('Create contract → sign via token', async () => {
    const app = await getApp();
    const s = new Scenario('Contract: create + token sign');

    const salesToken = await s.step('Login as sales', () =>
      loginAs(app, 'sales@hassad.com', 'password123'),
    );
    const clientToken = await s.step('Login as client', () =>
      loginAs(app, 'client@hassad.com', 'password123'),
    );

    const req = await s.step('Create request → SUBMITTED', () =>
      createRequest(app, salesToken.accessToken, {
        companyName: '[TEST] Contract Co',
        contactName: 'Test Client',
        phoneWhatsapp: '+966500000002',
        businessName: 'Contract Co Ltd',
        businessType: 'SERVICE',
        source: 'WEBSITE',
      }),
    );
    expect(req.status).toBe('SUBMITTED');

    await s.step('Move QUALIFYING', () =>
      transitionRequest(app, salesToken.accessToken, req.id, 'QUALIFYING'),
    );

    await s.step('Move PROPOSAL_IN_PROGRESS', () =>
      transitionRequest(
        app,
        salesToken.accessToken,
        req.id,
        'PROPOSAL_IN_PROGRESS',
      ),
    );

    await s.step('Move PROPOSAL_SENT', () =>
      transitionRequest(app, salesToken.accessToken, req.id, 'PROPOSAL_SENT'),
    );

    await s.step('Move NEGOTIATION', () =>
      transitionRequest(app, salesToken.accessToken, req.id, 'NEGOTIATION'),
    );

    await s.step('Move CONTRACT_PREPARATION', () =>
      transitionRequest(
        app,
        salesToken.accessToken,
        req.id,
        'CONTRACT_PREPARATION',
      ),
    );

    const contract = await s.step('Create contract with PDF', () =>
      createContract(app, salesToken.accessToken, {
        requestId: req.id,
        title: '[TEST] Monthly Retainer Contract',
        type: 'MONTHLY_RETAINER',
        totalValue: 60000,
        downPaymentType: 'PERCENT',
        downPaymentValue: 20,
      }),
    );
    expect(contract.status).toBe('SENT');
    expect(contract.shareLinkToken).toBeTruthy();

    const signed = await s.step('Client signs via token', () =>
      signContractByToken(
        app,
        contract.shareLinkToken,
        clientToken.accessToken,
        'Test Client',
      ),
    );
    expect(signed.status).toBe('SIGNED');

    s.finish();
  });

  test('Invalid shareLinkToken returns 404', async () => {
    const app = await getApp();
    const s = new Scenario('Contract: invalid token');

    const clientToken = await s.step('Login as client', () =>
      loginAs(app, 'client@hassad.com', 'password123'),
    );

    const res = await s.step('Try signing with fake token', async () => {
      const sut = (await import('supertest')).default;
      return sut(app.getHttpServer())
        .post('/v1/contracts/share/fake-token-123/sign')
        .auth(clientToken.accessToken, { type: 'bearer' })
        .send({ signedByName: 'Fake' });
    });
    expect(res.status).toBe(404);

    s.finish();
  });
});
