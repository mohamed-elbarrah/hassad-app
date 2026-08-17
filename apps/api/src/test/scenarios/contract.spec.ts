import { describe, test, expect, afterAll } from "vitest";
import { getApp, closeApp } from "../helpers/setup";
import { getPrisma } from "../helpers/prisma";
import { Scenario } from "../helpers/scenario";
import { loginAs } from "../steps/auth.steps";
import { createRequest, transitionRequest } from "../steps/request.steps";
import { createContract, signContractByToken } from "../steps/contract.steps";
import { ContractPaymentPlanService } from "../../modules/contracts/services/contract-payment-plan.service";
import { ContractCronService } from "../../modules/contracts/services/contract-cron.service";
import { ContractsService } from "../../modules/contracts/services/contracts.service";

afterAll(async () => {
  await closeApp();
});

describe("Contracts", () => {
  test("Create contract → sign via token", async () => {
    const app = await getApp();
    const s = new Scenario("Contract: create + token sign");

    const salesToken = await s.step("Login as sales", () =>
      loginAs(app, "sales@hassad.com", "password123"),
    );
    const clientToken = await s.step("Login as client", () =>
      loginAs(app, "client@hassad.com", "password123"),
    );

    const req = await s.step("Create request → SUBMITTED", () =>
      createRequest(app, salesToken.accessToken, {
        companyName: "[TEST] Contract Co",
        contactName: "Test Client",
        phoneWhatsapp: "+966500000002",
        businessName: "Contract Co Ltd",
        businessType: "SERVICE",
        source: "WEBSITE",
      }),
    );
    expect(req.status).toBe("SUBMITTED");

    await s.step("Move QUALIFYING", () =>
      transitionRequest(app, salesToken.accessToken, req.id, "QUALIFYING"),
    );

    await s.step("Move PROPOSAL_IN_PROGRESS", () =>
      transitionRequest(
        app,
        salesToken.accessToken,
        req.id,
        "PROPOSAL_IN_PROGRESS",
      ),
    );

    await s.step("Move PROPOSAL_SENT", () =>
      transitionRequest(app, salesToken.accessToken, req.id, "PROPOSAL_SENT"),
    );

    await s.step("Move NEGOTIATION", () =>
      transitionRequest(app, salesToken.accessToken, req.id, "NEGOTIATION"),
    );

    await s.step("Move CONTRACT_PREPARATION", () =>
      transitionRequest(
        app,
        salesToken.accessToken,
        req.id,
        "CONTRACT_PREPARATION",
      ),
    );

    const contract = await s.step("Create contract with PDF", () =>
      createContract(app, salesToken.accessToken, {
        requestId: req.id,
        title: "[TEST] Monthly Retainer Contract",
        type: "MONTHLY_RETAINER",
        totalValue: 60000,
      }),
    );
    expect(contract.status).toBe("SENT");
    expect(contract.shareLinkToken).toBeTruthy();

    const creationHistory = await getPrisma().contractStatusHistory.findFirst({
      where: { contractId: contract.id, toStatus: "SENT" },
      select: { fromStatus: true, toStatus: true, changedBy: true },
    });
    expect(creationHistory).toMatchObject({
      fromStatus: "DRAFT",
      toStatus: "SENT",
      changedBy: expect.any(String),
    });

    const contractsService = app.get(ContractsService);
    const paymentPlanService = new ContractPaymentPlanService(
      getPrisma() as any,
    );
    await paymentPlanService.definePlan(contract.id, {
      rows: [
        {
          label: "Existing recurring payment",
          sequence: 0,
          triggerType: "PERIOD_END",
          amountType: "FIXED",
          amountValue: 100,
        },
      ],
    } as any);
    const totalAndPlanRace = await Promise.allSettled([
      contractsService.update(contract.id, { totalValue: 500 }),
      paymentPlanService.addRow(contract.id, {
        label: "Concurrent down payment",
        sequence: 1,
        triggerType: "ON_SIGN",
        amountType: "FIXED",
        amountValue: 800,
      } as any),
    ]);
    const currentContract = await getPrisma().contract.findUniqueOrThrow({
      where: { id: contract.id },
      select: { totalValue: true },
    });
    const activeOnSignRows = await getPrisma().contractPaymentPlan.findMany({
      where: {
        contractId: contract.id,
        isActive: true,
        triggerType: "ON_SIGN",
      },
      select: { amountType: true, amountValue: true },
    });
    expect(
      totalAndPlanRace.every((result) => result.status === "fulfilled"),
    ).toBe(false);
    if (currentContract.totalValue === 500) {
      expect(
        activeOnSignRows.every(
          (row) =>
            row.amountType !== "FIXED" ||
            row.amountValue <= currentContract.totalValue,
        ),
      ).toBe(true);
    }
    const defineResults = await Promise.allSettled([
      paymentPlanService.definePlan(contract.id, {
        rows: [
          {
            label: "Concurrent A",
            sequence: 0,
            triggerType: "ON_SIGN",
            amountType: "FIXED",
            amountValue: 100,
          },
          {
            label: "Concurrent A recurring",
            sequence: 1,
            triggerType: "PERIOD_END",
            amountType: "FIXED",
            amountValue: 900,
          },
        ],
      } as any),
      paymentPlanService.definePlan(contract.id, {
        rows: [
          {
            label: "Concurrent B",
            sequence: 0,
            triggerType: "ON_SIGN",
            amountType: "FIXED",
            amountValue: 200,
          },
          {
            label: "Concurrent B recurring",
            sequence: 1,
            triggerType: "PERIOD_END",
            amountType: "FIXED",
            amountValue: 800,
          },
        ],
      } as any),
    ]);
    expect(defineResults.every((result) => result.status === "fulfilled")).toBe(
      true,
    );
    expect(
      await getPrisma().contractPaymentPlan.count({
        where: { contractId: contract.id, isActive: true },
      }),
    ).toBe(2);

    const addResults = await Promise.allSettled([
      paymentPlanService.addRow(contract.id, {
        label: "Concurrent sequence A",
        sequence: 77,
        triggerType: "PERIOD_END",
        amountType: "FIXED",
        amountValue: 10,
      } as any),
      paymentPlanService.addRow(contract.id, {
        label: "Concurrent sequence B",
        sequence: 77,
        triggerType: "PERIOD_END",
        amountType: "FIXED",
        amountValue: 20,
      } as any),
    ]);
    expect(
      addResults.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      addResults.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);

    const rows = await getPrisma().contractPaymentPlan.findMany({
      where: { contractId: contract.id, isActive: true },
      orderBy: { sequence: "asc" },
    });
    const updateResults = await Promise.allSettled([
      paymentPlanService.updateRow(contract.id, rows[0].id, {
        label: rows[0].label,
        sequence: 88,
        triggerType: rows[0].triggerType,
        amountType: rows[0].amountType,
        amountValue: rows[0].amountValue,
      } as any),
      paymentPlanService.updateRow(contract.id, rows[1].id, {
        label: rows[1].label,
        sequence: 88,
        triggerType: rows[1].triggerType,
        amountType: rows[1].amountType,
        amountValue: rows[1].amountValue,
      } as any),
    ]);
    expect(
      updateResults.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      updateResults.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);

    const historicalRowId = rows[0].id;
    await Promise.allSettled([
      paymentPlanService.definePlan(contract.id, {
        rows: [
          {
            label: "Replacement down payment",
            sequence: 0,
            triggerType: "ON_SIGN",
            amountType: "FIXED",
            amountValue: 100,
          },
          {
            label: "Replacement recurring",
            sequence: 1,
            triggerType: "PERIOD_END",
            amountType: "FIXED",
            amountValue: 1000,
          },
        ],
      } as any),
      paymentPlanService.removeRow(contract.id, historicalRowId),
    ]);
    expect(
      await getPrisma().contractPaymentPlan.findUnique({
        where: { id: historicalRowId },
        select: { isActive: true },
      }),
    ).toMatchObject({ isActive: false });

    const signed = await s.step("Client signs via token", () =>
      signContractByToken(
        app,
        contract.shareLinkToken,
        clientToken.accessToken,
        "Test Client",
      ),
    );
    expect(signed.status).toBe("SIGNED");

    const signingHistory = await getPrisma().contractStatusHistory.findFirst({
      where: { contractId: contract.id, toStatus: "SIGNED" },
      select: { fromStatus: true, toStatus: true, changedBy: true },
    });
    expect(signingHistory).toMatchObject({
      fromStatus: "SENT",
      toStatus: "SIGNED",
    });

    const contractOwner = await getPrisma().contract.findUniqueOrThrow({
      where: { id: contract.id },
      select: { createdBy: true },
    });
    const versionResults = await Promise.allSettled([
      contractsService.createVersion(
        contract.id,
        contractOwner.createdBy,
        "contracts/concurrent-version-a.pdf",
        { notes: "Concurrent version A" },
      ),
      contractsService.createVersion(
        contract.id,
        contractOwner.createdBy,
        "contracts/concurrent-version-b.pdf",
        { notes: "Concurrent version B" },
      ),
    ]);
    expect(
      versionResults.every((result) => result.status === "fulfilled"),
    ).toBe(true);
    expect(
      await getPrisma().contractVersion.findMany({
        where: { contractId: contract.id },
        orderBy: { versionNumber: "asc" },
        select: { versionNumber: true },
      }),
    ).toEqual([{ versionNumber: 2 }, { versionNumber: 3 }]);

    await getPrisma().contract.update({
      where: { id: contract.id },
      data: { endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    });
    await getPrisma().contractRenewalAlert.create({
      data: {
        contractId: contract.id,
        alertType: "THIRTY_DAYS",
        isSent: true,
        scheduledAt: new Date(),
      },
    });
    const contractCron = app.get(ContractCronService);
    await Promise.all([
      contractCron.handleExpiringContracts(),
      contractCron.handleExpiringContracts(),
    ]);
    expect(
      await getPrisma().notificationEvent.count({
        where: {
          entityId: contract.id,
          entityType: "CONTRACT",
          eventType: "RENEWAL_ESCALATED",
        },
      }),
    ).toBe(1);

    s.finish();
  });

  test("Invalid shareLinkToken returns 404", async () => {
    const app = await getApp();
    const s = new Scenario("Contract: invalid token");

    const clientToken = await s.step("Login as client", () =>
      loginAs(app, "client@hassad.com", "password123"),
    );

    const res = await s.step("Try signing with fake token", async () => {
      const sut = (await import("supertest")).default;
      return sut(app.getHttpServer())
        .post("/v1/contracts/share/fake-token-123/sign")
        .auth(clientToken.accessToken, { type: "bearer" })
        .send({ signedByName: "Fake" });
    });
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      data: null,
      error: {
        code: "CONTRACT_LINK_EXPIRED",
      },
    });

    const getRes = await s.step("Read fake share link", async () => {
      const sut = (await import("supertest")).default;
      return sut(app.getHttpServer())
        .get("/v1/contracts/share/fake-token-123")
        .auth(clientToken.accessToken, { type: "bearer" });
    });
    expect(getRes.status).toBe(404);
    expect(getRes.body).toEqual({
      success: false,
      data: null,
      error: expect.objectContaining({ code: "CONTRACT_LINK_EXPIRED" }),
    });

    s.finish();
  });

  test("returns stable contract-not-found and missing-PDF envelopes", async () => {
    const app = await getApp();
    const adminToken = await loginAs(app, "admin@hassad.com", "password123");
    const sut = (await import("supertest")).default;
    const missingId = "00000000-0000-0000-0000-000000000000";

    const missingContract = await sut(app.getHttpServer())
      .get(`/v1/contracts/${missingId}`)
      .auth(adminToken.accessToken, { type: "bearer" });
    expect(missingContract.status).toBe(404);
    expect(missingContract.body).toEqual({
      success: false,
      data: null,
      error: expect.objectContaining({ code: "CONTRACT_NOT_FOUND" }),
    });

    const missingPdf = await sut(app.getHttpServer())
      .post("/v1/contracts")
      .auth(adminToken.accessToken, { type: "bearer" })
      .field("requestId", missingId)
      .field("title", "[TEST] Missing PDF")
      .field("type", "ONE_TIME_SERVICE");
    expect(missingPdf.status).toBe(400);
    expect(missingPdf.body).toEqual({
      success: false,
      data: null,
      error: expect.objectContaining({ code: "CONTRACT_PDF_REQUIRED" }),
    });

    const history = await getPrisma().contractStatusHistory.count({
      where: { contractId: missingId },
    });
    expect(history).toBe(0);
  });
});
