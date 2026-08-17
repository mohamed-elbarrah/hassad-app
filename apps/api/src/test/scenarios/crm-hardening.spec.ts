import { afterAll, describe, expect, test, vi } from "vitest";
import request from "supertest";
import { AutomationService } from "../../modules/crm/services/automation.service";
import { ClientCounterService } from "../../modules/crm/services/client-counter.service";
import { ClientProfileService } from "../../modules/crm/services/client-profile.service";
import { ClientsService } from "../../modules/crm/services/clients.service";
import { CrmClientsService } from "../../modules/crm/services/crm-clients.service";
import { CrmContractsService } from "../../modules/crm/services/crm-contracts.service";
import { CrmOrdersService } from "../../modules/crm/services/crm-orders.service";
import { CrmProposalsService } from "../../modules/crm/services/crm-proposals.service";
import { CrmChatController } from "../../modules/crm/controllers/crm-chat.controller";
import { CrmOverviewService } from "../../modules/crm/services/crm-overview.service";
import { NotificationsService } from "../../modules/notifications/services/notifications.service";
import { getPrisma } from "../helpers/prisma";
import { closeApp, getApp } from "../helpers/setup";
import { loginAs } from "../steps/auth.steps";
import {
  AutomationStatus,
  ProposalStatus,
  ContractStatus,
  RequestStatus,
} from "@hassad/shared";

afterAll(async () => {
  vi.restoreAllMocks();
  await closeApp();
});

function expectCode(error: unknown, code: string) {
  expect(error).toMatchObject({ response: { code } });
}

describe("CRM hardening", () => {
  test("uses stable automation resource codes and an explicit execution shape", async () => {
    const prisma = {
      requestAutomationRule: { findUnique: vi.fn().mockResolvedValue(null) },
    } as any;
    const service = new AutomationService(prisma);

    await expect(
      service.executeRule({ ruleId: "missing-rule", requestId: "request-id" }),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "AUTOMATION_RULE_NOT_FOUND");
      return true;
    });

    prisma.requestAutomationRule.findUnique.mockResolvedValue({
      id: "rule-id",
      isActive: true,
      actionJson: { type: "NOTIFY" },
    });
    prisma.request = {
      findUnique: vi.fn().mockResolvedValue({ id: "request-id" }),
    };
    prisma.requestAutomationLog = {
      create: vi.fn().mockResolvedValue({ id: "log-id" }),
      update: vi.fn().mockResolvedValue({}),
    };

    await expect(
      service.executeRule({ ruleId: "rule-id", requestId: "request-id" }),
    ).resolves.toEqual({
      action: "automation_executed",
      automation: {
        logId: "log-id",
        ruleId: "rule-id",
        requestId: "request-id",
      },
    });

    prisma.requestAutomationRule.findUnique.mockResolvedValueOnce({
      id: "rule-id",
      isActive: true,
      actionJson: { type: "NOTIFY" },
    });
    prisma.request.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.executeRule({ ruleId: "rule-id", requestId: "missing-request" }),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "AUTOMATION_REQUEST_NOT_FOUND");
      return true;
    });
  });

  test("sanitizes automation execution failures in logs and responses", async () => {
    const rawProviderError = "provider secret: sk-live-automation-token";
    const failingAction = new Proxy(
      {},
      {
        get() {
          throw new Error(rawProviderError);
        },
      },
    );
    const logUpdate = vi.fn().mockResolvedValue({});
    const prisma = {
      requestAutomationRule: {
        findUnique: vi.fn().mockResolvedValue({
          id: "rule-id",
          isActive: true,
          actionJson: failingAction,
        }),
      },
      request: {
        findUnique: vi.fn().mockResolvedValue({ id: "request-id" }),
      },
      requestAutomationLog: {
        create: vi.fn().mockResolvedValue({ id: "log-id" }),
        update: logUpdate,
      },
    } as any;
    const service = new AutomationService(prisma);

    await expect(
      service.executeRule({ ruleId: "rule-id", requestId: "request-id" }),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "AUTOMATION_EXECUTION_FAILED");
      expect(error.getResponse()).toEqual({
        code: "AUTOMATION_EXECUTION_FAILED",
        message: "Automation execution failed",
        details: { ruleId: "rule-id", requestId: "request-id" },
      });
      expect(JSON.stringify(error.getResponse())).not.toContain(
        rawProviderError,
      );
      return true;
    });

    expect(logUpdate).toHaveBeenCalledWith({
      where: { id: "log-id" },
      data: {
        status: AutomationStatus.FAILED,
        responseData: {
          code: "AUTOMATION_EXECUTION_FAILED",
          ruleId: "rule-id",
          requestId: "request-id",
        },
      },
    });
    expect(JSON.stringify(logUpdate.mock.calls)).not.toContain(
      rawProviderError,
    );
  });

  test("sanitizes unknown automation lookup and log-creation failures", async () => {
    const rawProviderError = "provider response leaked: secret-provider-detail";
    const cases = [
      {
        name: "rule lookup",
        prisma: {
          requestAutomationRule: {
            findUnique: vi.fn().mockRejectedValue(new Error(rawProviderError)),
          },
        },
      },
      {
        name: "request lookup",
        prisma: {
          requestAutomationRule: {
            findUnique: vi.fn().mockResolvedValue({
              id: "rule-id",
              isActive: true,
              actionJson: { type: "NOTIFY" },
            }),
          },
          request: {
            findUnique: vi.fn().mockRejectedValue(new Error(rawProviderError)),
          },
        },
      },
      {
        name: "log creation",
        prisma: {
          requestAutomationRule: {
            findUnique: vi.fn().mockResolvedValue({
              id: "rule-id",
              isActive: true,
              actionJson: { type: "NOTIFY" },
            }),
          },
          request: {
            findUnique: vi.fn().mockResolvedValue({ id: "request-id" }),
          },
          requestAutomationLog: {
            create: vi.fn().mockRejectedValue(new Error(rawProviderError)),
          },
        },
      },
    ];

    for (const testCase of cases) {
      await expect(
        new AutomationService(testCase.prisma as any).executeRule({
          ruleId: "rule-id",
          requestId: "request-id",
        }),
      ).rejects.toSatisfy((error) => {
        expectCode(error, "AUTOMATION_EXECUTION_FAILED");
        expect(error.getResponse().message).toBe("Automation execution failed");
        expect(JSON.stringify(error.getResponse())).not.toContain(
          rawProviderError,
        );
        return true;
      });
    }
  });

  test("preserves the stable automation error when failure logging fails", async () => {
    const rawProviderError = "failure logger leaked provider credentials";
    const failingAction = new Proxy(
      {},
      {
        get() {
          throw new Error("action execution failed");
        },
      },
    );
    const logUpdate = vi.fn().mockRejectedValue(new Error(rawProviderError));
    const prisma = {
      requestAutomationRule: {
        findUnique: vi.fn().mockResolvedValue({
          id: "rule-id",
          isActive: true,
          actionJson: failingAction,
        }),
      },
      request: {
        findUnique: vi.fn().mockResolvedValue({ id: "request-id" }),
      },
      requestAutomationLog: {
        create: vi.fn().mockResolvedValue({ id: "log-id" }),
        update: logUpdate,
      },
    } as any;

    await expect(
      new AutomationService(prisma).executeRule({
        ruleId: "rule-id",
        requestId: "request-id",
      }),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "AUTOMATION_EXECUTION_FAILED");
      expect(JSON.stringify(error.getResponse())).not.toContain(
        rawProviderError,
      );
      return true;
    });
    expect(logUpdate).toHaveBeenCalledOnce();
  });

  test("rolls back client counters when counter history fails", async () => {
    let persisted = false;
    const historyError = new Error("counter history write failed");
    const transaction = vi.fn(async (callback: (tx: any) => unknown) => {
      try {
        return await callback({
          client: {
            update: vi.fn().mockImplementation(async () => {
              persisted = true;
              return { id: "client-id" };
            }),
          },
          clientHistoryLog: {
            create: vi.fn().mockRejectedValue(historyError),
          },
          user: {
            findFirst: vi.fn().mockResolvedValue({ id: "admin-id" }),
          },
        });
      } catch (error) {
        persisted = false;
        throw error;
      }
    });
    const service = new ClientCounterService({
      $transaction: transaction,
    } as any);
    vi.spyOn(service, "aggregateClientCounters").mockResolvedValue({
      totalProjects: 1,
      activeProjects: 1,
      completedProjects: 0,
      cancelledProjects: 0,
      totalContractValue: 100,
      totalInvoiced: 50,
      totalPaid: 25,
      lastProjectAt: null,
      avgSatisfactionScore: null,
    });

    await expect(service.recomputeAll("client-id")).rejects.toSatisfy(
      (error) => {
        expectCode(error, "CLIENT_COUNTER_UPDATE_FAILED");
        return true;
      },
    );
    expect(transaction).toHaveBeenCalledOnce();
    expect(persisted).toBe(false);
  });

  test("reuses a caller-supplied counter transaction", async () => {
    const rootTransaction = vi.fn();
    const clientUpdate = vi.fn().mockResolvedValue({ id: "client-id" });
    const historyCreate = vi.fn().mockResolvedValue({ id: "history-id" });
    const callerTransaction = {
      client: { update: clientUpdate },
      clientHistoryLog: { create: historyCreate },
      user: { findFirst: vi.fn().mockResolvedValue({ id: "admin-id" }) },
    };
    const service = new ClientCounterService({
      $transaction: rootTransaction,
    } as any);
    vi.spyOn(service, "aggregateClientCounters").mockResolvedValue({
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      cancelledProjects: 0,
      totalContractValue: 0,
      totalInvoiced: 0,
      totalPaid: 0,
      lastProjectAt: null,
      avgSatisfactionScore: null,
    });

    await service.recomputeAll("client-id", callerTransaction as any);

    expect(rootTransaction).not.toHaveBeenCalled();
    expect(clientUpdate).toHaveBeenCalledOnce();
    expect(historyCreate).toHaveBeenCalledWith({
      data: {
        clientId: "client-id",
        userId: "admin-id",
        eventType: "CLIENT_COUNTERS_UPDATED",
        description: "Client counters recomputed",
      },
    });
  });

  test("serializes recomputes against project creation and avoids stale counters", async () => {
    const prisma = getPrisma();
    const client = await prisma.client.findFirstOrThrow({
      where: { user: { email: "client@hassad.com" } },
      select: { id: true },
    });
    const initialProjectCount = await prisma.project.count({
      where: { clientId: client.id },
    });
    const projectName = `[TEST] Counter ordering ${Date.now()}`;

    let releaseFirstAggregation!: () => void;
    const firstAggregationReleased = new Promise<void>((resolve) => {
      releaseFirstAggregation = resolve;
    });
    let firstAggregationStarted!: () => void;
    const firstAggregationReady = new Promise<void>((resolve) => {
      firstAggregationStarted = resolve;
    });
    let released = false;
    const lockedPrisma = prisma.$extends({
      query: {
        $allModels: {
          async findUnique({ model, args, query }) {
            if (
              !released &&
              model === "Client" &&
              (args as any).where?.id === client.id
            ) {
              firstAggregationStarted();
              await firstAggregationReleased;
            }
            return query(args);
          },
        },
      },
    });
    const service = new ClientCounterService(lockedPrisma as any);

    try {
      const firstRecompute = service.recomputeAll(client.id);
      await firstAggregationReady;

      let projectCreated = false;
      const projectCreate = prisma.project
        .create({
          data: {
            clientId: client.id,
            name: projectName,
            status: "ACTIVE",
            priority: "NORMAL",
            startDate: new Date("2026-01-01T00:00:00.000Z"),
            endDate: new Date("2026-12-31T00:00:00.000Z"),
          },
        })
        .then((project) => {
          projectCreated = true;
          return project;
        });

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(projectCreated).toBe(false);

      released = true;
      releaseFirstAggregation();
      await firstRecompute;
      expect(
        (
          await prisma.client.findUniqueOrThrow({
            where: { id: client.id },
            select: { totalProjects: true },
          })
        ).totalProjects,
      ).toBe(initialProjectCount);

      await projectCreate;
      await service.recomputeAll(client.id);

      await expect(
        prisma.client.findUniqueOrThrow({
          where: { id: client.id },
          select: { totalProjects: true },
        }),
      ).resolves.toMatchObject({ totalProjects: initialProjectCount + 1 });
    } finally {
      released = true;
      releaseFirstAggregation();
      await prisma.project.deleteMany({ where: { name: projectName } });
    }
  });

  test("calculates total paid from successful payment records", async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      client: { findUnique: vi.fn().mockResolvedValue({ id: "client-id" }) },
      project: {
        groupBy: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      contract: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { totalValue: 1000 } }),
      },
      invoice: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 1000 } }),
      },
      payment: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 250 } }),
      },
      satisfactionRating: {
        aggregate: vi.fn().mockResolvedValue({ _avg: { score: null } }),
      },
    } as any;
    const service = new ClientCounterService(prisma);

    const counters = await service.aggregateClientCounters("client-id", prisma);

    expect(counters?.totalInvoiced).toBe(1000);
    expect(counters?.totalPaid).toBe(250);
    expect(prisma.payment.aggregate).toHaveBeenCalledWith({
      where: {
        status: "SUCCESS",
        OR: [
          { clientId: "client-id" },
          { clientId: null, invoice: { is: { clientId: "client-id" } } },
        ],
      },
      _sum: { amount: true },
    });
  });

  test("includes invoice-linked payments in CRM client detail results", async () => {
    const client = {
      id: "client-id",
      companyName: "Acme",
      manager: null,
      user: null,
      profile: null,
      requests: [],
      _count: {
        contracts: 0,
        projects: 0,
        invoices: 0,
        payments: 0,
        proposals: 0,
        requests: 0,
      },
      portalAccessToken: null,
      portalTokenExpiresAt: null,
    };
    const paymentFindMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      client: { findUnique: vi.fn().mockResolvedValue(client) },
      contract: { findMany: vi.fn().mockResolvedValue([]) },
      project: { findMany: vi.fn().mockResolvedValue([]) },
      invoice: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
      payment: { findMany: paymentFindMany },
      clientHistoryLog: { findMany: vi.fn().mockResolvedValue([]) },
      satisfactionRating: {
        findMany: vi.fn().mockResolvedValue([]),
        aggregate: vi.fn().mockResolvedValue({ _avg: { score: null } }),
      },
      disputeTicket: { findMany: vi.fn().mockResolvedValue([]) },
    } as any;

    await new CrmClientsService(prisma).getFull("client-id");

    expect(paymentFindMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { clientId: "client-id" },
          { clientId: null, invoice: { is: { clientId: "client-id" } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        amount: true,
        method: true,
        status: true,
        createdAt: true,
        invoice: { select: { id: true, invoiceNumber: true } },
      },
    });
  });

  test("uses stable client and profile deletion contracts", async () => {
    const missingClientDb = {
      client: { findUnique: vi.fn().mockResolvedValue(null) },
    } as any;
    await expect(
      new CrmClientsService(missingClientDb).getFull("missing-client"),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "CLIENT_NOT_FOUND");
      return true;
    });

    await expect(
      new ClientsService(missingClientDb, {} as any).findOne("missing-client"),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "CLIENT_NOT_FOUND");
      return true;
    });

    await expect(
      new ClientProfileService(missingClientDb).getTeamView("missing-client"),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "CLIENT_NOT_FOUND");
      return true;
    });

    const profileDb = {
      clientProfile: {
        findUnique: vi.fn().mockResolvedValue({ id: "profile-id" }),
        update: vi
          .fn()
          .mockResolvedValue({ id: "profile-id", clientId: "client-id" }),
      },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
        callback(profileDb),
      ),
      clientHistoryLog: {
        create: vi.fn().mockResolvedValue({ id: "history-id" }),
      },
    } as any;
    await expect(
      new ClientProfileService(profileDb).delete("client-id", "user-id"),
    ).resolves.toEqual({
      deleted: true,
    });
    expect(profileDb.$transaction).toHaveBeenCalledOnce();
    expect(profileDb.clientProfile.update).toHaveBeenCalledWith({
      where: { clientId: "client-id" },
      data: expect.objectContaining({
        industry: null,
        communicationInfo: null,
        visualIdentityInfo: null,
      }),
    });
    expect(profileDb.clientHistoryLog.create).toHaveBeenCalledWith({
      data: {
        clientId: "client-id",
        userId: "user-id",
        eventType: "CLIENT_PROFILE_DELETED",
        description: "Client profile data cleared",
        metadata: { profileId: "profile-id", operation: "soft_clear" },
      },
    });
    expect(profileDb.clientProfile.delete).toBeUndefined();

    const missingProfileDb = {
      clientProfile: { findUnique: vi.fn().mockResolvedValue(null) },
    } as any;
    await expect(
      new ClientProfileService(missingProfileDb).delete("client-id", "user-id"),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "CLIENT_NOT_FOUND");
      return true;
    });

    await expect(
      new ClientsService({} as any, {} as any).handover(
        "client-id",
        "user-id",
        {} as any,
      ),
    ).rejects.toSatisfy((error) => {
      expect(error.getStatus()).toBe(400);
      expect(error.getResponse()).toEqual({
        code: "CLIENT_HANDOVER_DISABLED",
        message:
          "Direct client handover is disabled. Create projects from signed contracts so the request workflow remains canonical.",
        details: null,
      });
      return true;
    });
  });

  test("denies team-view access when a client requests another client", async () => {
    const prisma = {
      client: {
        findFirst: vi.fn().mockResolvedValue({ id: "owned-client-id" }),
        findUnique: vi.fn(),
      },
    } as any;

    await expect(
      new ClientProfileService(prisma).getTeamView("other-client-id", {
        id: "client-user-id",
        role: "CLIENT",
      }),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "PROFILE_ACCESS_DENIED");
      return true;
    });
    expect(prisma.client.findFirst).toHaveBeenCalledWith({
      where: { userId: "client-user-id" },
      select: { id: true },
    });
  });

  test("maps missing CRM proposals and contracts to stable codes", async () => {
    const proposalDb = {
      proposal: { findUnique: vi.fn().mockResolvedValue(null) },
    } as any;
    const proposalService = new CrmProposalsService(
      proposalDb,
      {} as NotificationsService,
      {} as any,
    );

    await expect(proposalService.findOne("missing-proposal")).rejects.toSatisfy(
      (error) => {
        expectCode(error, "PROPOSAL_NOT_FOUND");
        return true;
      },
    );
    await expect(
      proposalService.update("missing-proposal", {} as any),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "PROPOSAL_NOT_FOUND");
      return true;
    });
    await expect(proposalService.send("missing-proposal")).rejects.toSatisfy(
      (error) => {
        expectCode(error, "PROPOSAL_NOT_FOUND");
        return true;
      },
    );

    const contractDb = {
      contract: { findUnique: vi.fn().mockResolvedValue(null) },
    } as any;
    const contractService = new CrmContractsService(
      contractDb,
      {} as NotificationsService,
      {} as any,
    );
    await expect(contractService.findOne("missing-contract")).rejects.toSatisfy(
      (error) => {
        expectCode(error, "CONTRACT_NOT_FOUND");
        return true;
      },
    );
    await expect(
      contractService.update("missing-contract", {} as any),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "CONTRACT_NOT_FOUND");
      return true;
    });
    await expect(contractService.send("missing-contract")).rejects.toSatisfy(
      (error) => {
        expectCode(error, "CONTRACT_NOT_FOUND");
        return true;
      },
    );
  });

  test("maps CRM request stages and returns an explicit action resource", async () => {
    const request = {
      id: "request-id",
      companyName: "Acme",
      crmStage: "NEW",
      status: RequestStatus.SUBMITTED,
    };
    const txRequestFindUnique = vi.fn().mockResolvedValue(request);
    const prisma = {
      request: { findUnique: vi.fn().mockResolvedValue(request) },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
        callback({
          $queryRaw: vi.fn().mockResolvedValue([]),
          request: {
            update: vi.fn(),
            findUnique: txRequestFindUnique,
          },
          crmNote: { create: vi.fn() },
        }),
      ),
    } as any;
    const requestsService = {
      updateStatus: vi.fn().mockResolvedValue({
        id: "request-id",
        status: RequestStatus.QUALIFYING,
      }),
    };
    const service = new CrmOrdersService(prisma, requestsService as any);

    await expect(
      service.updateStage("request-id", "user-id", "SCHEDULED"),
    ).resolves.toEqual(
      expect.objectContaining({
        action: "stage_updated",
        request: {
          id: "request-id",
          crmStage: "SCHEDULED",
          status: RequestStatus.QUALIFYING,
        },
      }),
    );
    expect(requestsService.updateStatus).toHaveBeenCalledWith(
      "request-id",
      RequestStatus.QUALIFYING,
      "user-id",
      undefined,
      expect.anything(),
    );

    prisma.request.findUnique.mockResolvedValue(null);
    await expect(service.findOne("missing-request")).rejects.toSatisfy(
      (error) => {
        expectCode(error, "REQUEST_NOT_FOUND");
        return true;
      },
    );
    await expect(
      service.createNote("missing-request", "user-id", "note"),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "REQUEST_CANONICAL_NOT_FOUND");
      return true;
    });
    txRequestFindUnique.mockResolvedValue(null);
    await expect(
      service.updateStage("missing-request", "user-id", "SCHEDULED"),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "REQUEST_NOT_FOUND");
      return true;
    });
  });

  test("keeps CRM transaction boundaries and request status transitions explicit", async () => {
    const txRequestUpdate = vi.fn().mockResolvedValue({});
    const txCrmNoteCreate = vi.fn().mockResolvedValue({});
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      request: {
        update: txRequestUpdate,
        findUnique: vi.fn().mockResolvedValue({
          id: "request-id",
          companyName: "Acme",
          crmStage: "NEW",
          status: RequestStatus.SUBMITTED,
        }),
      },
      crmNote: { create: txCrmNoteCreate },
    };
    const prisma = {
      request: {
        findUnique: vi.fn().mockResolvedValue({
          id: "request-id",
          companyName: "Acme",
          crmStage: "NEW",
          status: RequestStatus.SUBMITTED,
        }),
      },
      $transaction: vi.fn(async (callback: (transaction: any) => unknown) =>
        callback(tx),
      ),
    } as any;

    const requestsService = {
      updateStatus: vi.fn().mockResolvedValue({
        id: "request-id",
        status: RequestStatus.QUALIFYING,
      }),
    };
    await new CrmOrdersService(prisma, requestsService as any).updateStage(
      "request-id",
      "user-id",
      "SCHEDULED",
      "Qualified on discovery call",
    );

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(requestsService.updateStatus).toHaveBeenCalledWith(
      "request-id",
      RequestStatus.QUALIFYING,
      "user-id",
      "Qualified on discovery call",
      tx,
    );
    expect(txRequestUpdate).toHaveBeenCalledWith({
      where: { id: "request-id" },
      data: { crmStage: "SCHEDULED" },
    });
    expect(txCrmNoteCreate).toHaveBeenCalledWith({
      data: {
        requestId: "request-id",
        authorId: "user-id",
        content: "Qualified on discovery call",
      },
    });
  });

  test.each([undefined, null, "   "])(
    "rejects a missing or blank CRM order note: %j",
    async (content) => {
      const service = new CrmOrdersService({} as any, {} as any);

      await expect(
        service.createNote("request-id", "user-id", content as any),
      ).rejects.toSatisfy((error) => {
        expectCode(error, "ORDER_NOTE_REQUIRED");
        return true;
      });
    },
  );

  test("rechecks the stage under a row lock before rejecting duplicates", async () => {
    const txRequestFindUnique = vi.fn().mockResolvedValue({
      id: "request-id",
      companyName: "Acme",
      crmStage: "SCHEDULED",
      status: RequestStatus.QUALIFYING,
    });
    const txQueryRaw = vi.fn().mockResolvedValue([]);
    const requestsService = {
      updateStatus: vi.fn(),
    };
    const service = new CrmOrdersService(
      {
        request: {
          findUnique: vi.fn().mockResolvedValue({
            id: "request-id",
            companyName: "Acme",
            crmStage: "NEW",
            status: RequestStatus.SUBMITTED,
          }),
        },
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback({
            $queryRaw: txQueryRaw,
            request: {
              findUnique: txRequestFindUnique,
              update: vi.fn(),
            },
          }),
        ),
      } as any,
      requestsService as any,
    );

    await expect(
      service.updateStage("request-id", "user-id", "SCHEDULED"),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "ORDER_STAGE_UNCHANGED");
      return true;
    });
    expect(txQueryRaw).toHaveBeenCalledOnce();
    expect(txRequestFindUnique).toHaveBeenCalledOnce();
    expect(requestsService.updateStatus).not.toHaveBeenCalled();
  });

  test("returns one duplicate-stage error when concurrent CRM updates target the same stage", async () => {
    const app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const created = await request(app.getHttpServer())
      .post("/v1/requests")
      .auth(admin.accessToken, { type: "bearer" })
      .send({
        companyName: `[TEST] Concurrent CRM stage ${Date.now()}`,
        contactName: "Concurrent Stage Contact",
        phoneWhatsapp: "+966500000097",
        email: `crm-stage-${Date.now()}@example.com`,
        businessName: "Concurrent Stage Business",
        businessType: "SERVICE",
        source: "WEBSITE",
      });
    expect(created.status).toBe(201);

    const responses = await Promise.all([
      request(app.getHttpServer())
        .post(`/v1/crm/orders/${created.body.data.id}/stage`)
        .auth(admin.accessToken, { type: "bearer" })
        .send({ toStage: "SCHEDULED" }),
      request(app.getHttpServer())
        .post(`/v1/crm/orders/${created.body.data.id}/stage`)
        .auth(admin.accessToken, { type: "bearer" })
        .send({ toStage: "SCHEDULED" }),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 400,
    ]);
    expect(
      responses.find((response) => response.status === 400)?.body.error.code,
    ).toBe("ORDER_STAGE_UNCHANGED");
  });

  test("preserves canonical request errors for forbidden CRM stage changes", async () => {
    const transitionError = {
      response: { code: "REQUEST_INVALID_STATUS_TRANSITION" },
    };
    const requestsService = {
      updateStatus: vi.fn().mockRejectedValue(transitionError),
    };
    const requestUpdate = vi.fn();
    const service = new CrmOrdersService(
      {
        request: {
          findUnique: vi.fn().mockResolvedValue({
            id: "request-id",
            companyName: "Acme",
            crmStage: "CANCELLED",
            status: RequestStatus.CANCELLED,
          }),
        },
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback({
            $queryRaw: vi.fn().mockResolvedValue([]),
            request: {
              update: requestUpdate,
              findUnique: vi.fn().mockResolvedValue({
                id: "request-id",
                companyName: "Acme",
                crmStage: "CANCELLED",
                status: RequestStatus.CANCELLED,
              }),
            },
            crmNote: { create: vi.fn() },
          }),
        ),
      } as any,
      requestsService as any,
    );

    await expect(
      service.updateStage("request-id", "user-id", "NEW"),
    ).rejects.toBe(transitionError);
    expect(requestsService.updateStatus).toHaveBeenCalledOnce();
    expect(requestUpdate).not.toHaveBeenCalled();
  });

  test("keeps contract creation and payment-plan writes in one transaction", async () => {
    const paymentPlanError = new Error("payment plan write failed");
    const contractCreate = vi.fn().mockResolvedValue({ id: "contract-id" });
    const paymentPlanCreateMany = vi.fn().mockRejectedValue(paymentPlanError);
    const transaction = vi.fn(async (callback: (tx: any) => unknown) =>
      callback({
        contract: { create: contractCreate },
        contractPaymentPlan: { createMany: paymentPlanCreateMany },
      }),
    );
    const requestsService = {
      resolveRequestContext: vi.fn().mockResolvedValue({
        id: "request-id",
        clientId: "client-id",
      }),
    };
    const service = new CrmContractsService(
      { $transaction: transaction } as any,
      {} as NotificationsService,
      requestsService as any,
    );

    await expect(
      service.create("user-id", {
        requestId: "request-id",
        title: "Contract",
        type: "FIXED_PROJECT",
        paymentPlan: [
          {
            label: "Deposit",
            triggerType: "UPFRONT",
            amountType: "PERCENT",
            amountValue: 50,
          },
        ],
      } as any),
    ).rejects.toBe(paymentPlanError);
    expect(transaction).toHaveBeenCalledOnce();
    expect(contractCreate).toHaveBeenCalledOnce();
    expect(paymentPlanCreateMany).toHaveBeenCalledOnce();
  });

  test("rejects a contract when request and proposal references do not match", async () => {
    const contractCreate = vi.fn();
    const transaction = vi.fn(async (callback: (tx: any) => unknown) =>
      callback({
        proposal: {
          findUnique: vi.fn().mockResolvedValue({
            id: "proposal-id",
            requestId: "different-request-id",
            clientId: "client-id",
            totalPrice: 100,
            servicesList: [],
            durationDays: 30,
            startDate: null,
          }),
        },
        contract: { create: contractCreate },
      }),
    );
    const service = new CrmContractsService(
      { $transaction: transaction } as any,
      {} as NotificationsService,
      {
        resolveRequestContext: vi.fn().mockResolvedValue({
          id: "request-id",
          clientId: "client-id",
        }),
      } as any,
    );

    await expect(
      service.create("user-id", {
        requestId: "request-id",
        proposalId: "proposal-id",
        title: "Contract",
        type: "FIXED_PROJECT",
      } as any),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "CONTRACT_REFERENCE_MISMATCH");
      return true;
    });
    expect(contractCreate).not.toHaveBeenCalled();
  });

  test("rejects a contract when proposal ownership differs from the request client", async () => {
    const contractCreate = vi.fn();
    const transaction = vi.fn(async (callback: (tx: any) => unknown) =>
      callback({
        proposal: {
          findUnique: vi.fn().mockResolvedValue({
            id: "proposal-id",
            requestId: "request-id",
            clientId: "different-client-id",
            totalPrice: 100,
            servicesList: [],
            durationDays: 30,
            startDate: null,
          }),
        },
        contract: { create: contractCreate },
      }),
    );
    const service = new CrmContractsService(
      { $transaction: transaction } as any,
      {} as NotificationsService,
      {
        resolveRequestContext: vi.fn().mockResolvedValue({
          id: "request-id",
          clientId: "client-id",
        }),
      } as any,
    );

    await expect(
      service.create("user-id", {
        requestId: "request-id",
        proposalId: "proposal-id",
        title: "Contract",
        type: "FIXED_PROJECT",
      } as any),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "CONTRACT_REFERENCE_MISMATCH");
      return true;
    });
    expect(contractCreate).not.toHaveBeenCalled();
  });

  test("rejects a proposal-only contract when the proposal does not belong to its request", async () => {
    const contractCreate = vi.fn();
    const transaction = vi.fn(async (callback: (tx: any) => unknown) =>
      callback({
        proposal: {
          findUnique: vi.fn().mockResolvedValue({
            id: "proposal-id",
            requestId: "different-request-id",
            clientId: "client-id",
            totalPrice: 100,
            servicesList: [],
            durationDays: 30,
            startDate: null,
          }),
        },
        contract: { create: contractCreate },
      }),
    );
    const service = new CrmContractsService(
      { $transaction: transaction } as any,
      {} as NotificationsService,
      {
        resolveRequestContext: vi.fn().mockResolvedValue({
          id: "request-id",
          clientId: "client-id",
        }),
      } as any,
    );

    await expect(
      service.create("user-id", {
        proposalId: "proposal-id",
        title: "Contract",
        type: "FIXED_PROJECT",
      } as any),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "CONTRACT_REFERENCE_MISMATCH");
      return true;
    });
    expect(contractCreate).not.toHaveBeenCalled();
  });

  test("rolls back client updates when the client history write fails", async () => {
    const historyError = new Error("client history write failed");
    let persisted = false;
    const txClientUpdate = vi.fn().mockImplementation(async () => {
      persisted = true;
      return { id: "client-id" };
    });
    const txHistoryCreate = vi.fn().mockRejectedValue(historyError);
    const transaction = vi.fn(async (callback: (tx: any) => unknown) => {
      try {
        return await callback({
          client: { update: txClientUpdate },
          clientHistoryLog: { create: txHistoryCreate },
        });
      } catch (error) {
        persisted = false;
        throw error;
      }
    });
    const service = new ClientsService(
      {
        $transaction: transaction,
        client: { update: vi.fn() },
        clientHistoryLog: { create: vi.fn() },
      } as any,
      {} as any,
    );

    await expect(
      service.update("client-id", "user-id", { companyName: "Updated" } as any),
    ).rejects.toBe(historyError);
    expect(transaction).toHaveBeenCalledOnce();
    expect(txClientUpdate).toHaveBeenCalledOnce();
    expect(txHistoryCreate).toHaveBeenCalledWith({
      data: {
        clientId: "client-id",
        userId: "user-id",
        eventType: "CLIENT_UPDATED",
        description: "Client record updated",
      },
    });
    expect(persisted).toBe(false);
  });

  test("rolls back legacy client-profile upserts when history fails", async () => {
    const historyError = new Error("legacy profile history write failed");
    let persisted = false;
    const txProfileUpdate = vi.fn().mockImplementation(async () => {
      persisted = true;
      return { id: "profile-id", clientId: "client-id" };
    });
    const txHistoryCreate = vi.fn().mockRejectedValue(historyError);
    const transaction = vi.fn(async (callback: (tx: any) => unknown) => {
      try {
        return await callback({
          clientProfile: { update: txProfileUpdate },
          clientHistoryLog: { create: txHistoryCreate },
        });
      } catch (error) {
        persisted = false;
        throw error;
      }
    });
    const service = new ClientProfileService({
      clientProfile: {
        findUnique: vi.fn().mockResolvedValue({ id: "profile-id" }),
      },
      $transaction: transaction,
      clientHistoryLog: { create: vi.fn() },
    } as any);

    await expect(
      service.upsert("client-id", { industry: "Updated industry" } as any, {
        id: "user-id",
        role: "ADMIN",
      }),
    ).rejects.toBe(historyError);
    expect(transaction).toHaveBeenCalledOnce();
    expect(txProfileUpdate).toHaveBeenCalledOnce();
    expect(txHistoryCreate).toHaveBeenCalledWith({
      data: {
        clientId: "client-id",
        userId: "user-id",
        eventType: "CLIENT_PROFILE_UPDATED",
        description: "Client profile updated",
        metadata: { profileId: "profile-id" },
      },
    });
    expect(persisted).toBe(false);
  });

  test("rolls back V2 client-profile upserts when history fails", async () => {
    const historyError = new Error("V2 profile history write failed");
    let persisted = false;
    const txProfileUpdate = vi.fn().mockImplementation(async () => {
      persisted = true;
      return { id: "profile-id", clientId: "client-id" };
    });
    const txHistoryCreate = vi.fn().mockRejectedValue(historyError);
    const transaction = vi.fn(async (callback: (tx: any) => unknown) => {
      try {
        return await callback({
          clientProfile: { update: txProfileUpdate },
          clientHistoryLog: { create: txHistoryCreate },
        });
      } catch (error) {
        persisted = false;
        throw error;
      }
    });
    const service = new ClientProfileService({
      clientProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: "profile-id",
          communicationInfo: null,
          productInfo: null,
          audienceInfo: null,
          brandVoice: null,
          customerJourney: null,
          campaignInfo: null,
          pastPerformance: null,
          budgetInfo: null,
          visualIdentityInfo: null,
        }),
      },
      $transaction: transaction,
      clientHistoryLog: { create: vi.fn() },
    } as any);

    await expect(
      service.upsertV2(
        "client-id",
        { communicationInfo: { preferredChannel: "email" } } as any,
        { id: "user-id", role: "ADMIN" },
      ),
    ).rejects.toBe(historyError);
    expect(transaction).toHaveBeenCalledOnce();
    expect(txProfileUpdate).toHaveBeenCalledOnce();
    expect(txHistoryCreate).toHaveBeenCalledWith({
      data: {
        clientId: "client-id",
        userId: "user-id",
        eventType: "CLIENT_PROFILE_UPDATED",
        description: "Client profile updated (V2)",
        metadata: { profileId: "profile-id" },
      },
    });
    expect(persisted).toBe(false);
  });

  test("rolls back client-profile creation when history fails", async () => {
    const historyError = new Error("profile creation history write failed");
    let persisted = false;
    const txProfileCreate = vi.fn().mockImplementation(async () => {
      persisted = true;
      return { id: "profile-id", clientId: "client-id" };
    });
    const txHistoryCreate = vi.fn().mockRejectedValue(historyError);
    const transaction = vi.fn(async (callback: (tx: any) => unknown) => {
      try {
        return await callback({
          clientProfile: { create: txProfileCreate },
          client: { update: vi.fn().mockResolvedValue({}) },
          clientHistoryLog: { create: txHistoryCreate },
        });
      } catch (error) {
        persisted = false;
        throw error;
      }
    });
    const service = new ClientProfileService({
      client: { findFirst: vi.fn() },
      clientProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      $transaction: transaction,
      clientHistoryLog: { create: vi.fn() },
    } as any);

    await expect(
      service.upsert("client-id", { industry: "New industry" } as any, {
        id: "user-id",
        role: "ADMIN",
      }),
    ).rejects.toBe(historyError);
    expect(txProfileCreate).toHaveBeenCalledOnce();
    expect(txHistoryCreate).toHaveBeenCalledWith({
      data: {
        clientId: "client-id",
        userId: "user-id",
        eventType: "CLIENT_PROFILE_CREATED",
        description: "Client profile created",
        metadata: { profileId: "profile-id" },
      },
    });
    expect(persisted).toBe(false);
  });

  test("rolls back profile clearing when deletion history fails", async () => {
    const historyError = new Error("profile deletion history write failed");
    let persisted = false;
    const txProfileUpdate = vi.fn().mockImplementation(async () => {
      persisted = true;
      return { id: "profile-id", clientId: "client-id" };
    });
    const txHistoryCreate = vi.fn().mockRejectedValue(historyError);
    const transaction = vi.fn(async (callback: (tx: any) => unknown) => {
      try {
        return await callback({
          clientProfile: { update: txProfileUpdate },
          clientHistoryLog: { create: txHistoryCreate },
        });
      } catch (error) {
        persisted = false;
        throw error;
      }
    });
    const service = new ClientProfileService({
      clientProfile: {
        findUnique: vi.fn().mockResolvedValue({ id: "profile-id" }),
      },
      $transaction: transaction,
    } as any);

    await expect(service.delete("client-id", "user-id")).rejects.toBe(
      historyError,
    );
    expect(txProfileUpdate).toHaveBeenCalledOnce();
    expect(txHistoryCreate).toHaveBeenCalledWith({
      data: {
        clientId: "client-id",
        userId: "user-id",
        eventType: "CLIENT_PROFILE_DELETED",
        description: "Client profile data cleared",
        metadata: { profileId: "profile-id", operation: "soft_clear" },
      },
    });
    expect(persisted).toBe(false);
  });

  test("rolls back client creation when history fails", async () => {
    const historyError = new Error("client creation history write failed");
    let persisted = false;
    const txHistoryCreate = vi.fn().mockRejectedValue(historyError);
    const transaction = vi.fn(async (callback: (tx: any) => unknown) => {
      try {
        return await callback({
          clientHistoryLog: { create: txHistoryCreate },
        });
      } catch (error) {
        persisted = false;
        throw error;
      }
    });
    const canonicalClientService = {
      upsertCanonicalClient: vi.fn().mockImplementation(async () => {
        persisted = true;
        return {
          created: true,
          client: { id: "client-id" },
        };
      }),
    };
    const service = new ClientsService(
      { $transaction: transaction } as any,
      canonicalClientService as any,
    );

    await expect(
      service.create("user-id", {
        companyName: "Acme",
        businessName: "Acme",
        businessType: "SERVICE",
      } as any),
    ).rejects.toBe(historyError);
    expect(transaction).toHaveBeenCalledOnce();
    expect(canonicalClientService.upsertCanonicalClient).toHaveBeenCalledOnce();
    expect(txHistoryCreate).toHaveBeenCalledOnce();
    expect(persisted).toBe(false);
  });

  test("rolls back order-stage transitions when status history fails", async () => {
    const historyError = new Error("stage history write failed");
    let persisted = false;
    const transaction = vi.fn(async (callback: (tx: any) => unknown) => {
      try {
        return await callback({
          $queryRaw: vi.fn().mockResolvedValue([]),
          request: {
            update: vi.fn(),
            findUnique: vi.fn().mockResolvedValue({
              id: "request-id",
              companyName: "Acme",
              crmStage: "NEW",
              status: RequestStatus.SUBMITTED,
            }),
          },
          crmNote: { create: vi.fn() },
        });
      } catch (error) {
        persisted = false;
        throw error;
      }
    });
    const requestsService = {
      updateStatus: vi.fn().mockRejectedValue(historyError),
    };
    const service = new CrmOrdersService(
      {
        request: {
          findUnique: vi.fn().mockResolvedValue({
            id: "request-id",
            companyName: "Acme",
            crmStage: "NEW",
            status: RequestStatus.SUBMITTED,
          }),
        },
        $transaction: transaction,
      } as any,
      requestsService as any,
    );

    await expect(
      service.updateStage("request-id", "user-id", "SCHEDULED"),
    ).rejects.toBe(historyError);
    expect(requestsService.updateStatus).toHaveBeenCalledOnce();
    expect(persisted).toBe(false);
  });

  test("rolls back proposal send when the request transition fails", async () => {
    const transitionError = new Error("proposal request transition failed");
    let persisted = false;
    const txProposalUpdate = vi.fn().mockImplementation(async () => {
      persisted = true;
      return { id: "proposal-id", status: ProposalStatus.SENT };
    });
    const transaction = vi.fn(async (callback: (tx: any) => unknown) => {
      try {
        return await callback({ proposal: { update: txProposalUpdate } });
      } catch (error) {
        persisted = false;
        throw error;
      }
    });
    const requestsService = {
      resolveRequestContext: vi.fn().mockResolvedValue({ id: "request-id" }),
      updateStatus: vi.fn().mockRejectedValue(transitionError),
    };
    const service = new CrmProposalsService(
      {
        proposal: {
          findUnique: vi.fn().mockResolvedValue({
            id: "proposal-id",
            title: "Proposal",
            requestId: "request-id",
            createdBy: "creator-id",
          }),
        },
        $transaction: transaction,
      } as any,
      {} as NotificationsService,
      requestsService as any,
    );

    await expect(service.send("proposal-id", "user-id")).rejects.toBe(
      transitionError,
    );
    expect(txProposalUpdate).toHaveBeenCalledOnce();
    expect(requestsService.updateStatus).toHaveBeenCalledWith(
      "request-id",
      RequestStatus.PROPOSAL_SENT,
      "user-id",
      undefined,
      expect.anything(),
    );
    expect(persisted).toBe(false);
  });

  test("rolls back contract send when the request transition fails", async () => {
    const transitionError = new Error("contract request transition failed");
    let persisted = false;
    const txContractUpdate = vi.fn().mockImplementation(async () => {
      persisted = true;
      return { id: "contract-id", status: ContractStatus.SENT };
    });
    const transaction = vi.fn(async (callback: (tx: any) => unknown) => {
      try {
        return await callback({ contract: { update: txContractUpdate } });
      } catch (error) {
        persisted = false;
        throw error;
      }
    });
    const requestsService = {
      updateStatus: vi.fn().mockRejectedValue(transitionError),
    };
    const service = new CrmContractsService(
      {
        contract: {
          findUnique: vi.fn().mockResolvedValue({
            id: "contract-id",
            title: "Contract",
            requestId: "request-id",
            createdBy: "creator-id",
            clientId: "client-id",
          }),
        },
        $transaction: transaction,
      } as any,
      {} as NotificationsService,
      requestsService as any,
    );

    await expect(service.send("contract-id", "user-id")).rejects.toBe(
      transitionError,
    );
    expect(txContractUpdate).toHaveBeenCalledOnce();
    expect(requestsService.updateStatus).toHaveBeenCalledWith(
      "request-id",
      RequestStatus.CONTRACT_SENT,
      "user-id",
      undefined,
      expect.anything(),
    );
    expect(persisted).toBe(false);
  });

  test("maps direct-chat creation failures to one stable code", async () => {
    const directConversationService = {
      getOrCreate: vi.fn().mockResolvedValue(null),
    };
    const controller = new CrmChatController(
      {} as any,
      directConversationService as any,
      {} as any,
      {} as any,
    );

    await expect(
      controller.getDirectConversation({ id: "user-id" }, "other-user-id"),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "CHAT_DIRECT_CONVERSATION_CREATE_FAILED");
      return true;
    });
    await expect(
      controller.createDirectMessageWithFiles(
        { id: "user-id" },
        "other-user-id",
        {} as any,
        [],
      ),
    ).rejects.toSatisfy((error) => {
      expectCode(error, "CHAT_DIRECT_CONVERSATION_CREATE_FAILED");
      return true;
    });
  });

  test("preserves proposal and contract notification contracts", async () => {
    const proposalNotification = vi.fn().mockResolvedValue(undefined);
    const proposalDb = {
      proposal: {
        findUnique: vi.fn().mockResolvedValue({
          id: "proposal-id",
          title: "Proposal title",
          requestId: "request-id",
          createdBy: "creator-id",
        }),
        update: vi.fn().mockResolvedValue({
          id: "proposal-id",
          status: ProposalStatus.SENT,
        }),
      },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
        callback({ proposal: { update: proposalDb.proposal.update } }),
      ),
      request: {
        findUnique: vi.fn().mockResolvedValue({
          client: { userId: "client-user-id" },
          submittedBy: null,
        }),
      },
    } as any;
    const proposalService = new CrmProposalsService(
      proposalDb,
      { createLocalizedNotification: proposalNotification } as any,
      {
        resolveRequestContext: vi.fn().mockResolvedValue({ id: "request-id" }),
        updateStatus: vi.fn(),
      } as any,
    );
    await proposalService.send("proposal-id", "sender-id");
    expect(proposalNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: "proposal-id",
        entityType: "proposal",
        eventType: "PROPOSAL_SENT",
        userId: "client-user-id",
        messageKey: "crm.proposal_review",
        messageParams: { proposalTitle: "Proposal title" },
      }),
    );
    expect(proposalNotification.mock.calls[0][0].metadata).toBeUndefined();

    const contractNotification = vi.fn().mockResolvedValue(undefined);
    const contractDb = {
      contract: {
        findUnique: vi.fn().mockResolvedValue({
          id: "contract-id",
          title: "Contract title",
          requestId: "request-id",
          createdBy: "creator-id",
          clientId: "client-id",
        }),
        update: vi.fn().mockResolvedValue({
          id: "contract-id",
          status: ContractStatus.SENT,
        }),
      },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
        callback({ contract: { update: contractDb.contract.update } }),
      ),
      client: {
        findUnique: vi.fn().mockResolvedValue({
          userId: "client-user-id",
          accountManager: null,
          companyName: "Acme",
        }),
      },
    } as any;
    const contractService = new CrmContractsService(
      contractDb,
      { createLocalizedNotification: contractNotification } as any,
      { updateStatus: vi.fn() } as any,
    );
    await contractService.send("contract-id", "sender-id");
    expect(contractNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: "contract-id",
        entityType: "contract",
        eventType: "CONTRACT_SENT",
        userId: "client-user-id",
        messageKey: "crm.contract_review",
        messageParams: { contractTitle: "Contract title" },
      }),
    );
    expect(contractNotification.mock.calls[0][0].metadata).toBeUndefined();
  });

  test("isolates proposal and contract notification failures from committed actions", async () => {
    const proposalNotification = vi
      .fn()
      .mockRejectedValue(new Error("proposal notification unavailable"));
    const proposalTx = {
      proposal: {
        update: vi.fn().mockResolvedValue({
          id: "proposal-id",
          status: ProposalStatus.SENT,
        }),
      },
    };
    const proposalService = new CrmProposalsService(
      {
        proposal: {
          findUnique: vi.fn().mockResolvedValue({
            id: "proposal-id",
            title: "Proposal title",
            requestId: null,
            createdBy: "creator-id",
          }),
        },
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback(proposalTx),
        ),
        request: {
          findUnique: vi.fn().mockResolvedValue({
            client: null,
            submittedBy: "client-user-id",
          }),
        },
      } as any,
      { createLocalizedNotification: proposalNotification } as any,
      {} as any,
    );
    await expect(
      proposalService.send("proposal-id", "sender-id"),
    ).resolves.toMatchObject({ proposal: { id: "proposal-id" } });
    await Promise.resolve();
    expect(proposalNotification).toHaveBeenCalledOnce();

    const contractNotification = vi
      .fn()
      .mockRejectedValue(new Error("contract notification unavailable"));
    const contractTx = {
      contract: {
        update: vi.fn().mockResolvedValue({
          id: "contract-id",
          status: ContractStatus.SENT,
        }),
      },
    };
    const contractService = new CrmContractsService(
      {
        contract: {
          findUnique: vi.fn().mockResolvedValue({
            id: "contract-id",
            title: "Contract title",
            requestId: null,
            createdBy: "creator-id",
            clientId: "client-id",
          }),
        },
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback(contractTx),
        ),
        client: {
          findUnique: vi.fn().mockResolvedValue({
            userId: "client-user-id",
            accountManager: null,
            companyName: "Acme",
          }),
        },
      } as any,
      { createLocalizedNotification: contractNotification } as any,
      {} as any,
    );
    await expect(
      contractService.send("contract-id", "sender-id"),
    ).resolves.toMatchObject({ contract: { id: "contract-id" } });
    await Promise.resolve();
    expect(contractNotification).toHaveBeenCalledOnce();
  });

  test("returns a committed contract send when recipient lookup fails", async () => {
    const notification = vi.fn();
    const contractService = new CrmContractsService(
      {
        contract: {
          findUnique: vi.fn().mockResolvedValue({
            id: "contract-id",
            title: "Contract title",
            requestId: null,
            createdBy: "creator-id",
            clientId: "client-id",
          }),
        },
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback({
            contract: {
              update: vi.fn().mockResolvedValue({
                id: "contract-id",
                status: ContractStatus.SENT,
              }),
            },
          }),
        ),
        client: {
          findUnique: vi.fn().mockRejectedValue(new Error("database details")),
        },
      } as any,
      { createLocalizedNotification: notification } as any,
      {} as any,
    );

    await expect(
      contractService.send("contract-id", "sender-id"),
    ).resolves.toMatchObject({
      contract: { id: "contract-id" },
    });
    expect(notification).not.toHaveBeenCalled();
  });

  test("keeps CRM proposal and contract list mappings explicit", async () => {
    const proposalDb = {
      proposal: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "proposal-id",
            title: "Proposal title",
            totalPrice: 1250,
            status: ProposalStatus.SENT,
            sentAt: new Date("2026-01-02"),
            offerValidityDays: 30,
            client: { id: "client-id", companyName: "Acme" },
            request: {
              id: "request-id",
              companyName: "Acme",
              services: [{ service: { name: "Brand strategy" } }],
            },
            contract: {
              id: "contract-id",
              title: "Contract",
              status: ContractStatus.DRAFT,
            },
          },
        ]),
        count: vi.fn().mockResolvedValue(1),
      },
    } as any;
    const proposalRows = await new CrmProposalsService(
      proposalDb,
      {} as NotificationsService,
      {} as any,
    ).findAll({ page: 1, limit: 20 } as any);
    expect(proposalRows.items[0]).toMatchObject({
      id: "proposal-id",
      clientName: "Acme",
      requestName: "Acme",
      servicesCount: 1,
      servicesLabel: "Brand strategy",
      totalValue: 1250,
      status: ProposalStatus.SENT,
      contractLabel: "Linked to contract",
    });

    const contractDb = {
      contract: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "contract-id",
            title: "Contract title",
            type: "FIXED_PROJECT",
            status: ContractStatus.ACTIVE,
            monthlyValue: 0,
            totalValue: 1250,
            currency: "SAR",
            startDate: new Date("2026-01-01"),
            endDate: new Date("2026-02-01"),
            signedAt: new Date("2026-01-03"),
            versionNumber: 1,
            eSigned: true,
            createdAt: new Date("2026-01-01"),
            client: { companyName: "Acme" },
            renewalAlerts: [],
            projects: [],
            _count: { invoices: 0 },
          },
        ]),
        count: vi.fn().mockResolvedValue(1),
      },
    } as any;
    const contractRows = await new CrmContractsService(
      contractDb,
      {} as NotificationsService,
      {} as any,
    ).findAll({ page: "1", limit: "20" } as any);
    expect(contractRows.items[0]).toMatchObject({
      id: "contract-id",
      title: "Contract title",
      clientName: "Acme",
      status: ContractStatus.ACTIVE,
      invoiceCount: 0,
      project: null,
    });
  });

  test("uses English service labels in CRM overview output", async () => {
    const prisma = {
      request: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "request-id",
            crmStage: null,
            status: RequestStatus.SUBMITTED,
            companyName: "Acme",
            contactName: "Contact",
            phoneWhatsapp: null,
            businessName: "Acme Business",
            businessType: "SERVICE",
            source: "WEBSITE",
            assignee: null,
            submitter: null,
            services: [{ service: { name: "Brand strategy" } }],
            proposals: [],
            contracts: [],
            contactLogs: [],
            crmNotes: [],
            notes: null,
            internalNotes: null,
            updatedAt: new Date("2026-01-01"),
            lastContactAt: null,
            createdAt: new Date("2026-01-01"),
            contactAttemptCount: 0,
            client: { projects: [] },
          },
        ]),
      },
    } as any;
    const records = await new CrmOverviewService(prisma).findAll({} as any);
    expect(records[0].serviceLine).toBe("Brand strategy");
  });
});
