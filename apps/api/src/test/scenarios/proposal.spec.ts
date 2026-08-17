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

afterAll(async () => {
  await closeApp();
});

describe('Proposals', () => {
  test('Create proposal → approve via token', async () => {
    const app = await getApp();
    const s = new Scenario('Proposal: create + token approve');

    const salesToken = await s.step('Login as sales', () =>
      loginAs(app, 'sales@hassad.com', 'password123'),
    );
    const clientToken = await s.step('Login as client', () =>
      loginAs(app, 'client@hassad.com', 'password123'),
    );

    const req = await s.step('Create a request → SUBMITTED', () =>
      createRequest(app, salesToken.accessToken, {
        companyName: '[TEST] Web Co',
        contactName: 'Test Client',
        phoneWhatsapp: '+966500000000',
        businessName: 'Web Co Ltd',
        businessType: 'SERVICE',
        source: 'WEBSITE',
      }),
    );
    expect(req.status).toBe('SUBMITTED');

    await s.step('Move request QUALIFYING', () =>
      transitionRequest(app, salesToken.accessToken, req.id, 'QUALIFYING'),
    );

    await s.step('Move request PROPOSAL_IN_PROGRESS', () =>
      transitionRequest(
        app,
        salesToken.accessToken,
        req.id,
        'PROPOSAL_IN_PROGRESS',
      ),
    );

    const proposal = await s.step('Create proposal with PDF', () =>
      createProposal(app, salesToken.accessToken, {
        requestId: req.id,
        title: '[TEST] Website Design Proposal',
        totalPrice: 50000,
      }),
    );
    expect(proposal.status).toBe('SENT');
    expect(proposal.shareLinkToken).toBeTruthy();

    const approved = await s.step('Client approves via token', () =>
      approveProposalByToken(app, proposal.shareLinkToken, clientToken.accessToken),
    );
    expect(approved.status).toBe('APPROVED');

    s.finish();
  });

  test('Client requests revision via token', async () => {
    const app = await getApp();
    const s = new Scenario('Proposal: token revision');

    const salesToken = await s.step('Login as sales', () =>
      loginAs(app, 'sales@hassad.com', 'password123'),
    );
    const clientToken = await s.step('Login as client', () =>
      loginAs(app, 'client@hassad.com', 'password123'),
    );

    const req = await s.step('Create request → SUBMITTED', () =>
      createRequest(app, salesToken.accessToken, {
        companyName: '[TEST] Revise Co',
        contactName: 'Test Client',
        phoneWhatsapp: '+966500000001',
        businessName: 'Revise Co Ltd',
        businessType: 'SERVICE',
        source: 'REFERRAL',
      }),
    );

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

    const proposal = await s.step('Create proposal', () =>
      createProposal(app, salesToken.accessToken, {
        requestId: req.id,
        title: '[TEST] Revision Proposal',
        totalPrice: 30000,
      }),
    );
    expect(proposal.status).toBe('SENT');

    const revised = await s.step('Client requests revision', () =>
      revisionProposalByToken(app, proposal.shareLinkToken, clientToken.accessToken),
    );
    expect(revised.status).toBe('REVISION_REQUESTED');

    s.finish();
  });

  test('Invalid shareLinkToken returns 404', async () => {
    const app = await getApp();
    const s = new Scenario('Proposal: invalid token');

    const clientToken = await s.step('Login as client', () =>
      loginAs(app, 'client@hassad.com', 'password123'),
    );

    const res = await s.step('Try approving with fake token', async () => {
      const { default: req } = await import('supertest');
      return req(app.getHttpServer())
        .post('/v1/proposals/share/fake-token-123/approve')
        .set('Authorization', `Bearer ${clientToken.accessToken}`)
        .send({});
    });
    expect(res.status).toBe(404);

    s.finish();
  });
});
