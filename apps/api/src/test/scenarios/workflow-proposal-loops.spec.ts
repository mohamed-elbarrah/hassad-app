import { describe, test, expect, afterAll } from 'vitest';
import { getApp, closeApp } from '../helpers/setup';
import { Scenario } from '../helpers/scenario';
import { loginAs } from '../steps/auth.steps';
import { createRequest, transitionRequest } from '../steps/request.steps';
import {
  createProposal,
  approveProposalByToken,
  revisionProposalByToken,
} from '../steps/proposal.steps';
import request from 'supertest';

afterAll(async () => {
  await closeApp();
});

describe('Workflow: Proposal Branches', () => {
  test('Revision loop: client requests revision → sales resubmits → client approves', async () => {
    const app = await getApp();
    const s = new Scenario(
      'Proposal revision loop: SENT → REVISION_REQUESTED → SENT → APPROVED',
    );

    const salesToken = await s.step('Login as sales', () =>
      loginAs(app, 'sales@hassad.com', 'password123'),
    );
    const clientToken = await s.step('Login as client', () =>
      loginAs(app, 'client@hassad.com', 'password123'),
    );

    const req = await s.step('Create request → SUBMITTED', () =>
      createRequest(app, salesToken.accessToken, {
        companyName: '[E2E] Revision Loop Co',
        contactName: 'Revision Client',
        phoneWhatsapp: '+966522222222',
        businessName: 'Revision Co Ltd',
        businessType: 'SERVICE',
        source: 'REFERRAL',
      }),
    );
    expect(req.status).toBe('SUBMITTED');

    await s.step('Transition request QUALIFYING', () =>
      transitionRequest(app, salesToken.accessToken, req.id, 'QUALIFYING'),
    );

    await s.step('Transition request PROPOSAL_IN_PROGRESS', () =>
      transitionRequest(
        app,
        salesToken.accessToken,
        req.id,
        'PROPOSAL_IN_PROGRESS',
      ),
    );

    // Client requests revision
    const proposal = await s.step('Create proposal → SENT', () =>
      createProposal(app, salesToken.accessToken, {
        requestId: req.id,
        title: '[E2E] Revision Loop Proposal',
        totalPrice: 45000,
      }),
    );
    expect(proposal.status).toBe('SENT');

    const revised = await s.step(
      'Client requests revision → REVISION_REQUESTED',
      () =>
        revisionProposalByToken(
          app,
          proposal.shareLinkToken,
          clientToken.accessToken,
        ),
    );
    expect(revised.status).toBe('REVISION_REQUESTED');

    // Verify request went back to PROPOSAL_IN_PROGRESS
    await s.step(
      'Verify request is back to PROPOSAL_IN_PROGRESS',
      async () => {
        const res = await request(app.getHttpServer())
          .get(`/v1/requests/${req.id}`)
          .auth(salesToken.accessToken, { type: 'bearer' });
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('PROPOSAL_IN_PROGRESS');
      },
    );

    // Sales resubmits (creates new proposal revision)
    const resubmitted = await s.step(
      'Sales creates revised proposal → SENT (resubmission)',
      () =>
        createProposal(app, salesToken.accessToken, {
          requestId: req.id,
          title: '[E2E] Revision Loop Proposal (v2)',
          totalPrice: 42000,
        }),
    );
    expect(resubmitted.status).toBe('SENT');
    expect(resubmitted.shareLinkToken).toBeTruthy();

    // Client approves
    const approved = await s.step(
      'Client approves revised proposal → APPROVED',
      () =>
        approveProposalByToken(
          app,
          resubmitted.shareLinkToken,
          clientToken.accessToken,
        ),
    );
    expect(approved.status).toBe('APPROVED');

    // Verify request advanced to CONTRACT_PREPARATION
    await s.step(
      'Verify request is now CONTRACT_PREPARATION after approval',
      async () => {
        const res = await request(app.getHttpServer())
          .get(`/v1/requests/${req.id}`)
          .auth(salesToken.accessToken, { type: 'bearer' });
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('CONTRACT_PREPARATION');
      },
    );

    s.finish();
  });

  test('Proposal rejection via internal endpoint (sales/admin)', async () => {
    const app = await getApp();
    const s = new Scenario('Proposal rejection: SENT → REJECTED');

    const salesToken = await s.step('Login as sales', () =>
      loginAs(app, 'sales@hassad.com', 'password123'),
    );

    const req = await s.step('Create request → SUBMITTED', () =>
      createRequest(app, salesToken.accessToken, {
        companyName: '[E2E] Rejected Proposal Co',
        contactName: 'Rejected Client',
        phoneWhatsapp: '+966533333333',
        businessName: 'Rejected Co Ltd',
        businessType: 'SERVICE',
        source: 'WEBSITE',
      }),
    );

    await s.step('Transition through QUALIFYING', () =>
      transitionRequest(app, salesToken.accessToken, req.id, 'QUALIFYING'),
    );

    await s.step('Transition PROPOSAL_IN_PROGRESS', () =>
      transitionRequest(
        app,
        salesToken.accessToken,
        req.id,
        'PROPOSAL_IN_PROGRESS',
      ),
    );

    const proposal = await s.step('Create proposal → SENT', () =>
      createProposal(app, salesToken.accessToken, {
        requestId: req.id,
        title: '[E2E] Proposal to Reject',
        totalPrice: 25000,
      }),
    );
    expect(proposal.status).toBe('SENT');

    // Reject via internal endpoint (uses admin — SALES lacks proposals.reject permission)
    const adminToken = await s.step('Login as admin', () =>
      loginAs(app, 'admin@hassad.com', 'password123'),
    );

    await s.step('Reject proposal via internal endpoint', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/proposals/${proposal.id}/reject`)
        .auth(adminToken.accessToken, { type: 'bearer' });
      expect([200, 201]).toContain(res.status);
      expect(res.body.data.status).toBe('REJECTED');
    });

    // Verify proposal is REJECTED via GET
    await s.step('Verify proposal is REJECTED', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/proposals/${proposal.id}`)
        .auth(salesToken.accessToken, { type: 'bearer' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REJECTED');
    });

    s.finish();
  });
});
