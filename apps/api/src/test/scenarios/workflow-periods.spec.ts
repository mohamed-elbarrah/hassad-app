import { describe, test, expect, afterAll } from 'vitest';
import { getApp, closeApp } from '../helpers/setup';
import { getPrisma } from '../helpers/prisma';
import { Scenario } from '../helpers/scenario';
import { loginAs } from '../steps/auth.steps';
import { getFirstProjectId } from '../steps/task.steps';
import { registerPayment } from '../steps/payment.steps';
import request from 'supertest';

afterAll(async () => {
  await closeApp();
});

describe('Workflow: Period Lifecycle', () => {
  test('Close active period → opens next period → generates period-end invoice → pay it', async () => {
    const app = await getApp();
    const s = new Scenario(
      'Period: close ACTIVE period → next UPCOMING activates → invoice created → pay',
    );
    const db = getPrisma();

    // Find the seed project (ACTIVE retainer with periods)
    const seedProject = await s.step('Find seed ACTIVE project with periods', async () => {
      const project = await db.project.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true, clientId: true },
      });
      expect(project).not.toBeNull();
      return project!;
    });

    // Find the active period (period 4) and upcoming period (period 5)
    const periods = await s.step('Find ACTIVE and UPCOMING periods', async () => {
      const allPeriods = await db.projectPeriod.findMany({
        where: { projectId: seedProject.id },
        orderBy: { periodNumber: 'asc' },
        select: { id: true, periodNumber: true, status: true },
      });
      expect(allPeriods.length).toBeGreaterThanOrEqual(6);

      const activePeriod = allPeriods.find(p => p.status === 'ACTIVE');
      const upcomingPeriod = allPeriods.find(p => p.status === 'UPCOMING');
      expect(activePeriod).not.toBeNull();
      expect(upcomingPeriod).not.toBeNull();

      return { active: activePeriod!, upcoming: upcomingPeriod! };
    });

    // Login as PM to close the period
    const pmToken = await s.step('Login as PM', () =>
      loginAs(app, 'pm@hassad.com', 'password123'),
    );

    // Close the active period via POST /v1/projects/periods/:periodId/close
    const closeResult = await s.step('Close ACTIVE period → CLOSED', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/projects/periods/${periods.active.id}/close`)
        .auth(pmToken.accessToken, { type: 'bearer' });
      expect([200, 201]).toContain(res.status);
      return res.body.data;
    });
    expect(closeResult.status).toBe('CLOSED');

    // Verify the next period is now ACTIVE
    await s.step('Verify next period (formerly UPCOMING) is now ACTIVE', async () => {
      const p = await db.projectPeriod.findUnique({
        where: { id: periods.upcoming.id },
        select: { status: true },
      });
      expect(p!.status).toBe('ACTIVE');
    });

    // Verify a period-end invoice was created
    const periodInvoice = await s.step('Find period-end invoice for closed period', async () => {
      const invoice = await db.invoice.findFirst({
        where: {
          period: { id: periods.active.id },
        },
        select: { id: true, amount: true, status: true },
      });
      expect(invoice).not.toBeNull();
      expect(invoice!.status).toBe('PENDING');
      return invoice!;
    });

    // Login as accountant and pay the period-end invoice via BANK_TRANSFER
    const accountantToken = await s.step('Login as accountant', () =>
      loginAs(app, 'accountant@hassad.com', 'password123'),
    );

    const payment = await s.step(
      'Pay period-end invoice via BANK_TRANSFER → SUCCESS',
      () =>
        registerPayment(app, accountantToken.accessToken, periodInvoice.id, {
          amount: periodInvoice.amount,
          method: 'BANK_TRANSFER',
          notes: 'Period payment via bank transfer',
        }),
    );
    expect(payment.status).toBe('SUCCESS');

    // Verify invoice is now PAID
    await s.step('Verify period-end invoice is PAID in DB', async () => {
      const inv = await db.invoice.findUnique({
        where: { id: periodInvoice.id },
        select: { status: true },
      });
      expect(inv!.status).toBe('PAID');
    });

    s.finish();
  });
});
