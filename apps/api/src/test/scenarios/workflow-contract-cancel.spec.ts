import { describe, test, expect, afterAll } from 'vitest';
import { getApp, closeApp } from '../helpers/setup';
import { getPrisma } from '../helpers/prisma';
import { Scenario } from '../helpers/scenario';
import { loginAs } from '../steps/auth.steps';
import { createRequest, transitionRequest } from '../steps/request.steps';
import { createContract } from '../steps/contract.steps';
import request from 'supertest';

afterAll(async () => {
  await closeApp();
});

describe('Workflow: Contract Branches', () => {
  test('Cancel contract after creation (SENT → CANCELLED)', async () => {
    const app = await getApp();
    const s = new Scenario('Contract cancellation: SENT → CANCELLED');
    const db = getPrisma();

    const salesToken = await s.step('Login as sales', () =>
      loginAs(app, 'sales@hassad.com', 'password123'),
    );

    const req = await s.step('Create request → SUBMITTED', () =>
      createRequest(app, salesToken.accessToken, {
        companyName: '[E2E] Cancel Contract Co',
        contactName: 'Cancel Client',
        phoneWhatsapp: '+966544444444',
        businessName: 'Cancel Co Ltd',
        businessType: 'SERVICE',
        source: 'WEBSITE',
      }),
    );

    await s.step('Transition through to CONTRACT_PREPARATION', async () => {
      await transitionRequest(
        app,
        salesToken.accessToken,
        req.id,
        'QUALIFYING',
      );
      await transitionRequest(
        app,
        salesToken.accessToken,
        req.id,
        'PROPOSAL_IN_PROGRESS',
      );
      await transitionRequest(
        app,
        salesToken.accessToken,
        req.id,
        'PROPOSAL_SENT',
      );
      await transitionRequest(
        app,
        salesToken.accessToken,
        req.id,
        'NEGOTIATION',
      );
      await transitionRequest(
        app,
        salesToken.accessToken,
        req.id,
        'CONTRACT_PREPARATION',
      );
    });

    const contract = await s.step('Create contract → SENT', () =>
      createContract(app, salesToken.accessToken, {
        requestId: req.id,
        title: '[E2E] Contract to Cancel',
        type: 'MONTHLY_RETAINER',
        totalValue: 30000,
        downPaymentType: 'PERCENT',
        downPaymentValue: 30,
      }),
    );
    expect(contract.status).toBe('SENT');

    // Cancel via POST /v1/contracts/:id/cancel
    await s.step('Cancel contract via API', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/contracts/${contract.id}/cancel`)
        .auth(salesToken.accessToken, { type: 'bearer' });
      expect([200, 201]).toContain(res.status);
      expect(res.body.data.status).toBe('CANCELLED');
    });

    // Verify contract is CANCELLED in DB
    await s.step('Verify contract is CANCELLED in DB', async () => {
      const c = await db.contract.findUnique({
        where: { id: contract.id },
        select: { status: true },
      });
      expect(c!.status).toBe('CANCELLED');
    });

    // Verify request is CANCELLED
    await s.step('Verify request is CANCELLED', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/requests/${req.id}`)
        .auth(salesToken.accessToken, { type: 'bearer' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
    });

    s.finish();
  });

  test('Cannot activate unsigned contract', async () => {
    const app = await getApp();
    const s = new Scenario('Contract: activate unsigned → 400');

    const salesToken = await s.step('Login as sales', () =>
      loginAs(app, 'sales@hassad.com', 'password123'),
    );

    const req = await s.step('Create request → SUBMITTED', () =>
      createRequest(app, salesToken.accessToken, {
        companyName: '[E2E] Activate Unsigned Co',
        contactName: 'Unsigned Client',
        phoneWhatsapp: '+966555555555',
        businessName: 'Unsigned Co Ltd',
        businessType: 'SERVICE',
        source: 'REFERRAL',
      }),
    );

    await s.step('Transition through to CONTRACT_PREPARATION', async () => {
      await transitionRequest(
        app,
        salesToken.accessToken,
        req.id,
        'QUALIFYING',
      );
      await transitionRequest(
        app,
        salesToken.accessToken,
        req.id,
        'PROPOSAL_IN_PROGRESS',
      );
      await transitionRequest(
        app,
        salesToken.accessToken,
        req.id,
        'PROPOSAL_SENT',
      );
      await transitionRequest(
        app,
        salesToken.accessToken,
        req.id,
        'NEGOTIATION',
      );
      await transitionRequest(
        app,
        salesToken.accessToken,
        req.id,
        'CONTRACT_PREPARATION',
      );
    });

    const contract = await s.step('Create contract → SENT', () =>
      createContract(app, salesToken.accessToken, {
        requestId: req.id,
        title: '[E2E] Unsigned Activation Test',
        type: 'MONTHLY_RETAINER',
        totalValue: 15000,
        downPaymentType: 'PERCENT',
        downPaymentValue: 50,
      }),
    );

    await s.step('Try activating unsigned contract → 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/contracts/${contract.id}/activate`)
        .auth(salesToken.accessToken, { type: 'bearer' });
      expect(res.status).toBe(400);
    });

    s.finish();
  });
});
