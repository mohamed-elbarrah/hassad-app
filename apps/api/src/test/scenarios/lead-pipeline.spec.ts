import { describe, test, expect, afterAll } from 'vitest';
import { getApp, closeApp } from '../helpers/setup';
import { Scenario } from '../helpers/scenario';
import { getPrisma } from '../helpers/prisma';
import { loginAs } from '../steps/auth.steps';
import {
  createLead,
  moveLeadStage,
  moveLeadStageExpecting,
  getLead,
  convertLead,
} from '../steps/lead.steps';

afterAll(async () => {
  await closeApp();
});

describe('Lead Pipeline', () => {
  test('Happy path through all pipeline stages', async () => {
    const app = await getApp();
    const s = new Scenario('Lead pipeline: all stages');

    const tokens = await s.step('Login as sales', () =>
      loginAs(app, 'sales@hassad.com', 'password123'),
    );

    const lead = await s.step('Create lead → NEW', () =>
      createLead(app, tokens.accessToken, {
        companyName: '[TEST] Full Pipeline Corp',
      }),
    );
    expect(lead.pipelineStage).toBe('NEW');
    expect(lead.isActive).toBe(true);

    const stages = [
      'INTRO_SENT',
      'CALL_ATTEMPT',
      'MEETING_SCHEDULED',
      'MEETING_DONE',
    ];
    for (const stage of stages) {
      await s.step(`Move to ${stage}`, () =>
        moveLeadStage(app, tokens.accessToken, lead.id, stage),
      );
    }

    const updated = await s.step('Verify lead is at MEETING_DONE', () =>
      getLead(app, tokens.accessToken, lead.id),
    );
    expect(updated.pipelineStage).toBe('MEETING_DONE');

    s.finish();
  });

  test('Invalid transition: NEW → APPROVED returns 400', async () => {
    const app = await getApp();
    const s = new Scenario('Lead pipeline: skip stages');

    const tokens = await s.step('Login as sales', () =>
      loginAs(app, 'sales@hassad.com', 'password123'),
    );

    const lead = await s.step('Create lead → NEW', () =>
      createLead(app, tokens.accessToken, {
        companyName: '[TEST] Skip Stages Corp',
      }),
    );

    const status = await s.step('Try NEW → APPROVED directly', () =>
      moveLeadStageExpecting(app, tokens.accessToken, lead.id, 'APPROVED'),
    );
    expect(status).toBe(400);

    s.finish();
  });

  test('Lead stage changes create pipeline history', async () => {
    const app = await getApp();
    const s = new Scenario('Lead pipeline: history tracking');

    const tokens = await s.step('Login as sales', () =>
      loginAs(app, 'sales@hassad.com', 'password123'),
    );

    const lead = await s.step('Create lead → NEW', () =>
      createLead(app, tokens.accessToken, {
        companyName: '[TEST] History Corp',
      }),
    );

    await s.step('Move through 3 stages', async () => {
      await moveLeadStage(app, tokens.accessToken, lead.id, 'INTRO_SENT');
      await moveLeadStage(app, tokens.accessToken, lead.id, 'CALL_ATTEMPT');
      await moveLeadStage(app, tokens.accessToken, lead.id, 'MEETING_SCHEDULED');
    });

    const db = getPrisma();
    const history = await db.leadPipelineHistory.findMany({
      where: { leadId: lead.id },
      orderBy: { changedAt: 'asc' },
    });
    expect(history.length).toBeGreaterThanOrEqual(3);

    s.finish();
  });

  test('Cannot convert lead before CONTRACT_SIGNED stage', async () => {
    const app = await getApp();
    const s = new Scenario('Lead pipeline: early convert rejected');

    const tokens = await s.step('Login as sales', () =>
      loginAs(app, 'sales@hassad.com', 'password123'),
    );

    const lead = await s.step('Create lead → NEW', () =>
      createLead(app, tokens.accessToken, {
        companyName: '[TEST] Early Convert Corp',
      }),
    );

    await s.step('Move to MEETING_DONE', () =>
      moveLeadStage(app, tokens.accessToken, lead.id, 'MEETING_DONE'),
    );

    await s.step('Try converting before CONTRACT_SIGNED', async () => {
      const res = await import('supertest').then(m =>
        m.default(app.getHttpServer())
          .post(`/v1/leads/${lead.id}/convert`)
          .auth(tokens.accessToken, { type: 'bearer' }),
      );
      expect(res.status).toBe(403);
    });

    s.finish();
  });
});
