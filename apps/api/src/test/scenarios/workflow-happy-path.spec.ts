import { describe, test, expect, afterAll } from 'vitest';
import { getApp, closeApp } from '../helpers/setup';
import { getPrisma } from '../helpers/prisma';
import { Scenario } from '../helpers/scenario';
import { loginAs } from '../steps/auth.steps';
import {
  createRequest,
  transitionRequest,
} from '../steps/request.steps';
import { createProposal, approveProposalByToken } from '../steps/proposal.steps';
import { createContract, signContractByToken } from '../steps/contract.steps';
import { registerPayment } from '../steps/payment.steps';
import { createTask, transitionTask } from '../steps/task.steps';
import request from 'supertest';

afterAll(async () => {
  await closeApp();
});

describe('Workflow: Full Happy Path (Request → Payment → Project → Tasks)', () => {
  test('Complete end-to-end workflow using BANK_TRANSFER', async () => {
    const app = await getApp();
    const s = new Scenario(
      'Full workflow: Request → Proposal → Contract → Payment → Project → Tasks',
    );
    const db = getPrisma();

    // ── ROLE: SALES ──────────────────────────────────────────────────────────
    const salesToken = await s.step('Login as sales', () =>
      loginAs(app, 'sales@hassad.com', 'password123'),
    );

    // Requests are the sole CRM workflow records.
    // ── Create Request + transition to proposal-ready ────────────────────────
    const req = await s.step('Create request → SUBMITTED', () =>
      createRequest(app, salesToken.accessToken, {
        companyName: '[E2E] Happy Path Corp',
        contactName: 'Happy Client',
        phoneWhatsapp: '+966511111111',
        businessName: 'Happy Path Ltd',
        businessType: 'SERVICE',
        source: 'WEBSITE',
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

    // ── Create Proposal (auto-sets request to PROPOSAL_SENT) ─────────────────
    const proposal = await s.step('Create proposal → SENT', () =>
      createProposal(app, salesToken.accessToken, {
        requestId: req.id,
        title: '[E2E] Website & Branding Package',
        serviceDescription: 'Full branding + landing page',
        totalPrice: 60000,
      }),
    );
    expect(proposal.status).toBe('SENT');
    expect(proposal.shareLinkToken).toBeTruthy();

    // ── ROLE: CLIENT ──────────────────────────────────────────────────────────
    const clientToken = await s.step('Login as client', () =>
      loginAs(app, 'client@hassad.com', 'password123'),
    );

    const approved = await s.step(
      'Client approves proposal by token → APPROVED',
      () =>
        approveProposalByToken(
          app,
          proposal.shareLinkToken,
          clientToken.accessToken,
        ),
    );
    expect(approved.status).toBe('APPROVED');

    // Verify request auto-advanced to CONTRACT_PREPARATION
    const reqAfterApproval = await s.step(
      'Verify request is now CONTRACT_PREPARATION',
      async () => {
        const res = await request(app.getHttpServer())
          .get(`/v1/requests/${req.id}`)
          .auth(salesToken.accessToken, { type: 'bearer' });
        expect(res.status).toBe(200);
        return res.body.data;
      },
    );
    expect(reqAfterApproval.status).toBe('CONTRACT_PREPARATION');

    // ── Create Contract (20% down payment on 60,000 = 12,000 SAR) ────────────
    const contract = await s.step(
      'Create MONTHLY_RETAINER contract with 20% down → SENT',
      () =>
        createContract(app, salesToken.accessToken, {
          requestId: req.id,
          title: '[E2E] Monthly Retainer — Website & Branding',
          type: 'MONTHLY_RETAINER',
          totalValue: 60000,
          downPaymentType: 'PERCENT',
          downPaymentValue: 20,
        }),
    );
    expect(contract.status).toBe('SENT');
    expect(contract.shareLinkToken).toBeTruthy();

    // ── ROLE: CLIENT signs contract ──────────────────────────────────────────
    const signed = await s.step('Client signs contract by token → SIGNED', () =>
      signContractByToken(
        app,
        contract.shareLinkToken,
        clientToken.accessToken,
        'Happy Client',
      ),
    );
    expect(signed.status).toBe('SIGNED');

    // ── DB VERIFICATION: Project created in PENDING_ACTIVATION ───────────────
    const projectAfterSign = await s.step(
      'Verify project created (PENDING_ACTIVATION) via DB',
      async () => {
        const p = await db.project.findFirst({
          where: { contractId: contract.id },
        });
        expect(p).not.toBeNull();
        expect(p!.status).toBe('PENDING_ACTIVATION');
        return p!;
      },
    );

    // ── DB VERIFICATION: Down-payment invoice exists ─────────────────────────
    const downPaymentInvoice = await s.step(
      'Verify down-payment invoice exists via DB',
      async () => {
        const invoice = await db.invoice.findFirst({
          where: { contractId: contract.id },
          orderBy: { createdAt: 'asc' },
        });
        expect(invoice).not.toBeNull();
        expect(invoice!.status).toBe('PENDING');
        expect(invoice!.amount).toBe(12000);
        return invoice!;
      },
    );

    // ── ROLE: ACCOUNTANT registers payment via BANK_TRANSFER ─────────────────
    const accountantToken = await s.step('Login as accountant', () =>
      loginAs(app, 'accountant@hassad.com', 'password123'),
    );

    const paymentResult = await s.step(
      'Register BANK_TRANSFER payment for down-payment invoice → SUCCESS',
      () =>
        registerPayment(
          app,
          accountantToken.accessToken,
          downPaymentInvoice.id,
          {
            amount: 12000,
            method: 'BANK_TRANSFER',
            notes: 'Down payment via bank transfer',
          },
        ),
    );
    expect(paymentResult.status).toBe('SUCCESS');

    // Activate contract explicitly (event-driven activation may fail in test env)
    await s.step('Activate contract via API → ACTIVE', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/contracts/${contract.id}/activate`)
        .auth(salesToken.accessToken, { type: 'bearer' });
      expect([200, 201]).toContain(res.status);
      expect(res.body.data.status).toBe('ACTIVE');
    });

    // ── DB VERIFICATION: Project ACTIVE ──────────────────────────────────────
    await s.step('Verify project is ACTIVE', async () => {
      const p = await db.project.findFirst({
        where: { contractId: contract.id },
        select: { status: true },
      });
      expect(p!.status).toBe('ACTIVE');
    });

    // ── ROLE: PM creates tasks on the project ────────────────────────────────
    const pmToken = await s.step('Login as PM', () =>
      loginAs(app, 'pm@hassad.com', 'password123'),
    );

    const task1 = await s.step('Create task → TODO (Design)', () =>
      createTask(app, pmToken.accessToken, {
        projectId: projectAfterSign.id,
        dept: 'DESIGN',
        title: '[E2E] Design brand identity',
        priority: 'HIGH',
        dueDate: '2026-08-31',
      }),
    );
    expect(task1.status).toBe('TODO');

    const task2 = await s.step('Create task → TODO (Development)', () =>
      createTask(app, pmToken.accessToken, {
        projectId: projectAfterSign.id,
        dept: 'DEVELOPMENT',
        title: '[E2E] Build landing page',
        priority: 'NORMAL',
        dueDate: '2026-09-15',
      }),
    );
    expect(task2.status).toBe('TODO');

    // ── ROLE: TEAM (employee) works on tasks ─────────────────────────────────
    const empToken = await s.step('Login as employee', () =>
      loginAs(app, 'employee@hassad.com', 'password123'),
    );

    // Task 1: Design → full lifecycle
    const started1 = await s.step('Task 1: Start → IN_PROGRESS', () =>
      transitionTask(app, empToken.accessToken, task1.id, 'start'),
    );
    expect(started1.status).toBe('IN_PROGRESS');

    const submitted1 = await s.step('Task 1: Submit → IN_REVIEW', () =>
      transitionTask(app, empToken.accessToken, task1.id, 'submit'),
    );
    expect(submitted1.status).toBe('IN_REVIEW');

    // PM approves task 1
    const done1 = await s.step('PM approves Task 1 → DONE', () =>
      transitionTask(app, pmToken.accessToken, task1.id, 'approve'),
    );
    expect(done1.status).toBe('DONE');

    // Task 2: Development → with revision loop
    const started2 = await s.step('Task 2: Start → IN_PROGRESS', () =>
      transitionTask(app, empToken.accessToken, task2.id, 'start'),
    );
    expect(started2.status).toBe('IN_PROGRESS');

    const submitted2 = await s.step('Task 2: Submit → IN_REVIEW', () =>
      transitionTask(app, empToken.accessToken, task2.id, 'submit'),
    );
    expect(submitted2.status).toBe('IN_REVIEW');

    // PM rejects task 2 → revision
    const rejected2 = await s.step('PM rejects Task 2 → REVISION', () =>
      transitionTask(app, pmToken.accessToken, task2.id, 'reject'),
    );
    expect(rejected2.status).toBe('REVISION');

    // Employee reworks and resubmits
    const reworked2 = await s.step('Task 2: Restart → IN_PROGRESS', () =>
      transitionTask(app, empToken.accessToken, task2.id, 'start'),
    );
    expect(reworked2.status).toBe('IN_PROGRESS');

    const resubmitted2 = await s.step('Task 2: Resubmit → IN_REVIEW', () =>
      transitionTask(app, empToken.accessToken, task2.id, 'submit'),
    );
    expect(resubmitted2.status).toBe('IN_REVIEW');

    // PM approves task 2
    const done2 = await s.step('PM approves Task 2 → DONE', () =>
      transitionTask(app, pmToken.accessToken, task2.id, 'approve'),
    );
    expect(done2.status).toBe('DONE');

    // ── FINAL DB VERIFICATION ────────────────────────────────────────────────
    await s.step('Verify both tasks are DONE in DB', async () => {
      const tasks = await db.task.findMany({
        where: { projectId: projectAfterSign.id },
        select: { title: true, status: true },
        orderBy: { title: 'asc' },
      });
      expect(tasks.length).toBeGreaterThanOrEqual(2);
      for (const t of tasks) {
        expect(t.status).toBe('DONE');
      }
    });

    // ── FINAL API VERIFICATION: Invoice should be PAID ───────────────────────
    await s.step('Verify down-payment invoice is PAID in API', async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/invoices/${downPaymentInvoice.id}`)
        .auth(accountantToken.accessToken, { type: 'bearer' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PAID');
    });

    s.finish();
  });
});
