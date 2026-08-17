import { afterAll, describe, expect, test, vi } from "vitest";
import request from "supertest";
import {
  BusinessType,
  ClientStatus,
  ContactLogResult,
  ContactLogType,
  RequestStatus,
} from "@hassad/shared";
import { CanonicalClientService } from "../../modules/requests/canonical-client.service";
import { RequestsService } from "../../modules/requests/requests.service";
import { NotificationsService } from "../../modules/notifications/services/notifications.service";
import { SalesAssignmentService } from "../../modules/requests/sales-assignment.service";
import { PrismaService } from "../../prisma/prisma.service";
import { closeApp, getApp } from "../helpers/setup";
import { getPrisma } from "../helpers/prisma";
import { loginAs } from "../steps/auth.steps";

afterAll(async () => {
  await closeApp();
});

function expectDomainError(
  response: request.Response,
  status: number,
  code: string,
) {
  expect(response.status).toBe(status);
  expect(response.body.success).toBe(false);
  expect(response.body.data).toBeNull();
  expect(response.body.error.code).toBe(code);
}

async function createPortalRequest(
  app: Awaited<ReturnType<typeof getApp>>,
  token: string,
) {
  const response = await request(app.getHttpServer())
    .post("/v1/requests")
    .auth(token, { type: "bearer" })
    .send({
      companyName: `[TEST] Requests ${Date.now()}-${Math.random()}`,
      contactName: "Request Test Contact",
      phoneWhatsapp: "+966500000099",
      email: `requests-${Date.now()}@example.com`,
      businessName: `Requests Test Business ${Date.now()}`,
      businessType: BusinessType.SERVICE,
      source: "WEBSITE",
    });

  expect(response.status).toBe(201);
  return response.body.data;
}

describe("Requests contracts", () => {
  test("returns stable codes for missing request and contact-log resources", async () => {
    const app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");

    const requestResponse = await request(app.getHttpServer())
      .get("/v1/requests/00000000-0000-0000-0000-000000000000")
      .auth(admin.accessToken, { type: "bearer" });
    expectDomainError(requestResponse, 404, "REQUEST_NOT_FOUND");

    const contactLogResponse = await request(app.getHttpServer())
      .get("/v1/requests/00000000-0000-0000-0000-000000000000/contact-log")
      .auth(admin.accessToken, { type: "bearer" });
    expectDomainError(contactLogResponse, 404, "REQUEST_NOT_FOUND");
  });

  test("creates a contact log and counter update atomically", async () => {
    const app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const created = await createPortalRequest(app, admin.accessToken);
    const prisma = getPrisma();

    const response = await request(app.getHttpServer())
      .post(`/v1/requests/${created.id}/contact-log`)
      .auth(admin.accessToken, { type: "bearer" })
      .send({
        type: ContactLogType.CALL,
        result: ContactLogResult.RESPONDED,
        notes: "Confirmed requirements",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.requestId).toBe(created.id);

    const persistedRequest = await prisma.request.findUniqueOrThrow({
      where: { id: created.id },
      select: { contactAttemptCount: true, lastContactAt: true },
    });
    const persistedLog = await prisma.requestContactLog.findUniqueOrThrow({
      where: { id: response.body.data.id },
      select: { type: true, result: true, notes: true },
    });

    expect(persistedRequest.contactAttemptCount).toBe(1);
    expect(persistedRequest.lastContactAt).toBeInstanceOf(Date);
    expect(persistedLog).toEqual({
      type: ContactLogType.CALL,
      result: ContactLogResult.RESPONDED,
      notes: "Confirmed requirements",
    });
  });

  test("preserves caller-provided contact-log transaction behavior", async () => {
    const app = await getApp();
    const requestsService = app.get(RequestsService);
    const prisma = app.get(PrismaService);
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      request: {
        findUnique: vi.fn().mockResolvedValue({ id: "request-id" }),
        update: vi.fn().mockResolvedValue({ id: "request-id" }),
      },
      requestContactLog: {
        create: vi.fn().mockResolvedValue({ id: "log-id" }),
      },
    } as any;
    const transactionSpy = vi.spyOn(prisma, "$transaction");

    await requestsService.addContactLog(
      "request-id",
      "user-id",
      {
        type: ContactLogType.CALL,
        result: ContactLogResult.RESPONDED,
      },
      transaction,
    );

    expect(transactionSpy).not.toHaveBeenCalled();
    expect(transaction.requestContactLog.create).toHaveBeenCalledOnce();
    expect(transaction.request.update).toHaveBeenCalledOnce();
    transactionSpy.mockRestore();
  });

  test("preserves allowed transitions, idempotency, forbidden transitions, and history integrity", async () => {
    const app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const created = await createPortalRequest(app, admin.accessToken);
    const prisma = getPrisma();

    const qualifying = await request(app.getHttpServer())
      .post(`/v1/requests/${created.id}/status`)
      .auth(admin.accessToken, { type: "bearer" })
      .send({
        toStatus: RequestStatus.QUALIFYING,
        note: "Started qualification",
      });
    expect(qualifying.status).toBe(201);
    expect(qualifying.body.data.status).toBe(RequestStatus.QUALIFYING);

    const idempotent = await request(app.getHttpServer())
      .post(`/v1/requests/${created.id}/status`)
      .auth(admin.accessToken, { type: "bearer" })
      .send({ toStatus: RequestStatus.QUALIFYING });
    expect(idempotent.status).toBe(201);
    expect(idempotent.body.data.status).toBe(RequestStatus.QUALIFYING);

    const forbidden = await request(app.getHttpServer())
      .post(`/v1/requests/${created.id}/status`)
      .auth(admin.accessToken, { type: "bearer" })
      .send({ toStatus: RequestStatus.SIGNED });
    expectDomainError(forbidden, 400, "REQUEST_INVALID_STATUS_TRANSITION");

    const cancelled = await request(app.getHttpServer())
      .post(`/v1/requests/${created.id}/status`)
      .auth(admin.accessToken, { type: "bearer" })
      .send({ toStatus: RequestStatus.CANCELLED });
    expect(cancelled.status).toBe(201);

    const terminalRepeat = await request(app.getHttpServer())
      .post(`/v1/requests/${created.id}/status`)
      .auth(admin.accessToken, { type: "bearer" })
      .send({ toStatus: RequestStatus.CANCELLED });
    expect(terminalRepeat.status).toBe(201);

    const terminalForbidden = await request(app.getHttpServer())
      .post(`/v1/requests/${created.id}/status`)
      .auth(admin.accessToken, { type: "bearer" })
      .send({ toStatus: RequestStatus.SUBMITTED });
    expectDomainError(
      terminalForbidden,
      400,
      "REQUEST_INVALID_STATUS_TRANSITION",
    );

    const history = await prisma.requestStatusHistory.findMany({
      where: { requestId: created.id },
      orderBy: { changedAt: "asc" },
      select: { fromStatus: true, toStatus: true, note: true },
    });
    expect(history).toEqual([
      { fromStatus: null, toStatus: RequestStatus.SUBMITTED, note: null },
      {
        fromStatus: RequestStatus.SUBMITTED,
        toStatus: RequestStatus.QUALIFYING,
        note: "Started qualification",
      },
      {
        fromStatus: RequestStatus.QUALIFYING,
        toStatus: RequestStatus.CANCELLED,
        note: null,
      },
    ]);
  });

  test("returns canonical client intake validation codes", async () => {
    const app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const client = await getPrisma().client.findFirstOrThrow({
      where: { user: { email: "client@hassad.com" } },
    });

    const missingServices = await request(app.getHttpServer())
      .post("/v1/crm/requests/intake")
      .auth(admin.accessToken, { type: "bearer" })
      .send({
        mode: "existing",
        existingClient: { clientId: client.id },
        services: [],
      });
    expectDomainError(missingServices, 400, "REQUEST_SERVICE_REQUIRED");

    const missingExistingClient = await request(app.getHttpServer())
      .post("/v1/crm/requests/intake")
      .auth(admin.accessToken, { type: "bearer" })
      .send({ mode: "existing", services: [{ serviceId: "svc-branding" }] });
    expectDomainError(
      missingExistingClient,
      400,
      "REQUEST_EXISTING_CLIENT_REQUIRED",
    );

    const missingNewClient = await request(app.getHttpServer())
      .post("/v1/crm/requests/intake")
      .auth(admin.accessToken, { type: "bearer" })
      .send({ mode: "new", services: [{ serviceId: "svc-branding" }] });
    expectDomainError(missingNewClient, 400, "REQUEST_NEW_CLIENT_REQUIRED");

    const duplicateEmail = await request(app.getHttpServer())
      .post("/v1/crm/requests/intake")
      .auth(admin.accessToken, { type: "bearer" })
      .send({
        mode: "new",
        services: [{ serviceId: "svc-branding" }],
        newClient: {
          companyName: "[TEST] Duplicate Email Client",
          contactName: "Duplicate Email",
          phoneWhatsapp: "+966500000098",
          email: "client@hassad.com",
          password: "password123",
          businessName: "Duplicate Email Business",
          businessType: BusinessType.SERVICE,
        },
      });
    expectDomainError(duplicateEmail, 409, "CLIENT_EMAIL_ALREADY_EXISTS");

    const invalidMode = await request(app.getHttpServer())
      .post("/v1/crm/requests/intake")
      .auth(admin.accessToken, { type: "bearer" })
      .send({ mode: "invalid", services: [{ serviceId: "svc-branding" }] });
    expectDomainError(invalidMode, 400, "VALIDATION_FAILED");
  });

  test("returns client-not-found and stopped-client codes for direct intake", async () => {
    const app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const missingClient = await request(app.getHttpServer())
      .post("/v1/requests/for-client")
      .auth(admin.accessToken, { type: "bearer" })
      .send({
        clientId: "00000000-0000-0000-0000-000000000000",
        services: [{ serviceId: "00000000-0000-0000-0000-000000000001" }],
      });
    expectDomainError(missingClient, 404, "CLIENT_NOT_FOUND");

    const prisma = getPrisma();
    const client = await prisma.client.findFirstOrThrow({
      where: { user: { email: "client@hassad.com" } },
      select: { id: true, status: true },
    });
    await prisma.client.update({
      where: { id: client.id },
      data: { status: ClientStatus.STOPPED },
    });

    try {
      const stoppedClient = await request(app.getHttpServer())
        .post("/v1/requests/for-client")
        .auth(admin.accessToken, { type: "bearer" })
        .send({
          clientId: client.id,
          services: [{ serviceId: "00000000-0000-0000-0000-000000000001" }],
        });
      expectDomainError(stoppedClient, 400, "CLIENT_STOPPED");
    } finally {
      await prisma.client.update({
        where: { id: client.id },
        data: { status: client.status },
      });
    }
  });

  test("completes CRM intake for an existing seeded client", async () => {
    const app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const prisma = getPrisma();
    const client = await prisma.client.findFirstOrThrow({
      where: { user: { email: "client@hassad.com" } },
      select: { id: true },
    });

    const response = await request(app.getHttpServer())
      .post("/v1/crm/requests/intake")
      .auth(admin.accessToken, { type: "bearer" })
      .send({
        mode: "existing",
        existingClient: { clientId: client.id },
        services: [{ serviceId: "svc-branding", quantity: 1 }],
      });

    expect(response.status).toBe(201);
    expect(response.body.data.request.status).toBe(RequestStatus.SUBMITTED);
    expect(response.body.data.client.id).toBe(client.id);

    const history = await prisma.requestStatusHistory.findMany({
      where: { requestId: response.body.data.request.id },
    });
    expect(history).toHaveLength(1);
    expect(history[0].toStatus).toBe(RequestStatus.SUBMITTED);
  });

  test("rolls back an owned status transaction when history creation fails", async () => {
    const app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const created = await createPortalRequest(app, admin.accessToken);
    const requestsService = app.get(RequestsService);
    const prisma = getPrisma();

    await expect(
      requestsService.updateStatus(
        created.id,
        RequestStatus.QUALIFYING,
        "00000000-0000-0000-0000-000000000000",
      ),
    ).rejects.toBeTruthy();

    const requestAfterFailure = await prisma.request.findUniqueOrThrow({
      where: { id: created.id },
      select: { status: true },
    });
    const historyAfterFailure = await prisma.requestStatusHistory.count({
      where: { requestId: created.id },
    });
    expect(requestAfterFailure.status).toBe(RequestStatus.SUBMITTED);
    expect(historyAfterFailure).toBe(1);
  });

  test("rolls back canonical-client creation in a real Prisma transaction", async () => {
    const app = await getApp();
    const prisma = app.get(PrismaService);
    const canonicalClientService = app.get(CanonicalClientService);
    const owner = await prisma.user.findFirstOrThrow({
      where: { clientProfile: null, isActive: true },
      select: { id: true },
    });
    const companyName = `[TEST] Canonical rollback ${Date.now()}`;

    await expect(
      prisma.$transaction(async (tx) => {
        const result = await canonicalClientService.upsertCanonicalClient(tx, {
          userId: owner.id,
          companyName,
          businessName: `${companyName} Business`,
          businessType: BusinessType.SERVICE,
        });
        expect(result.created).toBe(true);
        throw new Error("force canonical rollback");
      }),
    ).rejects.toThrow("force canonical rollback");

    await expect(
      prisma.client.findFirst({ where: { companyName } }),
    ).resolves.toBeNull();
  });

  test("serializes concurrent idempotent transitions and keeps one history row", async () => {
    const app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const created = await createPortalRequest(app, admin.accessToken);
    const requestsService = app.get(RequestsService);

    await Promise.all([
      requestsService.updateStatus(created.id, RequestStatus.QUALIFYING),
      requestsService.updateStatus(created.id, RequestStatus.QUALIFYING),
    ]);

    const historyCount = await getPrisma().requestStatusHistory.count({
      where: { requestId: created.id, toStatus: RequestStatus.QUALIFYING },
    });
    expect(historyCount).toBe(1);
  });

  test("locks concurrent caller-supplied transactions before reading status", async () => {
    const app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const created = await createPortalRequest(app, admin.accessToken);
    const requestsService = app.get(RequestsService);
    const prisma = app.get(PrismaService);
    let releaseReads: (() => void) | undefined;
    const readsReleased = new Promise<void>((resolve) => {
      releaseReads = resolve;
    });
    const coordination = {
      lockCalls: 0,
      readCalls: 0,
      readsReleased,
    };

    const wrapTransaction = (transaction: any) =>
      new Proxy(transaction, {
        get(target, property, receiver) {
          if (property === "$queryRaw") {
            return (...args: unknown[]) => {
              coordination.lockCalls += 1;
              return Reflect.apply(target[property], target, args);
            };
          }

          if (property === "request") {
            return new Proxy(target.request, {
              get(requestTarget, requestProperty, requestReceiver) {
                if (requestProperty !== "findUnique") {
                  return Reflect.get(
                    requestTarget,
                    requestProperty,
                    requestReceiver,
                  );
                }

                return async (...args: unknown[]) => {
                  const result = await Reflect.apply(
                    requestTarget[requestProperty],
                    requestTarget,
                    args,
                  );
                  coordination.readCalls += 1;
                  if (
                    coordination.lockCalls === 0 &&
                    coordination.readCalls === 2
                  ) {
                    releaseReads?.();
                  }
                  if (coordination.lockCalls === 0) {
                    await coordination.readsReleased;
                  }
                  return result;
                };
              },
            });
          }

          return Reflect.get(target, property, receiver);
        },
      });

    await Promise.all([
      prisma.$transaction((tx) =>
        requestsService.updateStatus(
          created.id,
          RequestStatus.QUALIFYING,
          undefined,
          undefined,
          wrapTransaction(tx),
        ),
      ),
      prisma.$transaction((tx) =>
        requestsService.updateStatus(
          created.id,
          RequestStatus.QUALIFYING,
          undefined,
          undefined,
          wrapTransaction(tx),
        ),
      ),
    ]);

    const historyCount = await prisma.requestStatusHistory.count({
      where: { requestId: created.id, toStatus: RequestStatus.QUALIFYING },
    });
    expect(coordination.lockCalls).toBe(2);
    expect(historyCount).toBe(1);
  });

  test("keeps caller-provided transaction behavior without nesting a transaction", async () => {
    const app = await getApp();
    const requestsService = app.get(RequestsService);
    const prisma = app.get(PrismaService);
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      request: {
        findUnique: vi.fn().mockResolvedValue({
          id: "request-id",
          status: RequestStatus.SUBMITTED,
        }),
        update: vi.fn().mockResolvedValue({
          id: "request-id",
          status: RequestStatus.QUALIFYING,
        }),
      },
      requestStatusHistory: {
        create: vi.fn().mockResolvedValue({ id: "history-id" }),
      },
    } as any;
    const transactionSpy = vi.spyOn(prisma, "$transaction");
    transactionSpy.mockClear();

    await requestsService.updateStatus(
      "request-id",
      RequestStatus.QUALIFYING,
      "user-id",
      "note",
      transaction,
    );

    expect(transactionSpy).not.toHaveBeenCalled();
    expect(transaction.request.update).toHaveBeenCalledOnce();
    expect(transaction.requestStatusHistory.create).toHaveBeenCalledOnce();
    transactionSpy.mockRestore();
  });

  test("awaits transaction-bound canonical conversation failures", async () => {
    const existingClient = {
      id: "client-id",
      userId: "client-user-id",
      accountManager: "manager-id",
      companyName: "Company",
      businessName: "Business",
      businessType: BusinessType.OTHER,
      status: ClientStatus.LEAD,
    };
    const db = {
      client: {
        findFirst: vi.fn().mockResolvedValue(existingClient),
        findUnique: vi.fn().mockResolvedValue(existingClient),
      },
    } as any;
    const directConversationService = {
      getOrCreate: vi
        .fn()
        .mockRejectedValue({ message: "conversation failed" }),
    } as any;
    const salesAssignmentService = { findBestSales: vi.fn() } as any;
    const canonicalClientService = new CanonicalClientService(
      db,
      directConversationService,
      salesAssignmentService,
    );

    await expect(
      canonicalClientService.upsertCanonicalClient(db, {
        userId: existingClient.userId,
        companyName: existingClient.companyName,
        businessName: existingClient.businessName,
        businessType: existingClient.businessType,
      }),
    ).rejects.toMatchObject({ message: "conversation failed" });
    expect(directConversationService.getOrCreate).toHaveBeenCalledOnce();
  });

  test("maps canonical identity conflicts and resolution failures to domain codes", async () => {
    const conflictClient = {
      id: "client-id",
      userId: "another-user-id",
      accountManager: null,
      companyName: "Company",
      businessName: "Business",
      businessType: BusinessType.OTHER,
      status: ClientStatus.LEAD,
    };
    const conflictDb = {
      client: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(conflictClient),
      },
    } as any;
    const conflictService = new CanonicalClientService(
      conflictDb,
      { getOrCreate: vi.fn() } as any,
      { findBestSales: vi.fn().mockResolvedValue(null) } as any,
    );

    await expect(
      conflictService.upsertCanonicalClient(conflictDb, {
        userId: "requesting-user-id",
        companyName: "Company",
        businessName: "Business",
        businessType: BusinessType.SERVICE,
      }),
    ).rejects.toMatchObject({ response: { code: "CLIENT_IDENTITY_CONFLICT" } });

    const resolutionDb = {
      client: {
        findFirst: vi.fn().mockResolvedValue(conflictClient),
        update: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
      },
    } as any;
    const resolutionService = new CanonicalClientService(
      resolutionDb,
      { getOrCreate: vi.fn() } as any,
      { findBestSales: vi.fn().mockResolvedValue(null) } as any,
    );

    await expect(
      resolutionService.upsertCanonicalClient(resolutionDb, {
        companyName: "Company",
        businessName: "Business",
        businessType: BusinessType.SERVICE,
      }),
    ).rejects.toMatchObject({
      response: { code: "CLIENT_CANONICAL_RESOLUTION_FAILED" },
    });
  });

  test("maps service-only request reference, payload, role, and canonical errors", async () => {
    const app = await getApp();
    const requestsService = app.get(RequestsService);

    await expect(
      requestsService.resolveRequestContext({}),
    ).rejects.toMatchObject({
      response: { code: "REQUEST_REFERENCE_REQUIRED" },
    });

    await expect(
      requestsService.createCrmIntake("user-id", {
        mode: "existing",
        services: [{ serviceId: "svc-branding" }],
      } as any),
    ).rejects.toMatchObject({
      response: { code: "REQUEST_EXISTING_CLIENT_REQUIRED" },
    });

    await expect(
      requestsService.createCrmIntake("user-id", {
        mode: "invalid",
        services: [{ serviceId: "svc-branding" }],
      } as any),
    ).rejects.toMatchObject({
      response: { code: "REQUEST_CLIENT_PAYLOAD_REQUIRED" },
    });

    const missingRoleTransaction = {
      user: { findUnique: vi.fn().mockResolvedValue(null) },
      role: { findFirst: vi.fn().mockResolvedValue(null) },
    } as any;
    const missingRoleDb = {
      $transaction: vi.fn((callback: (tx: any) => unknown) =>
        callback(missingRoleTransaction),
      ),
    } as any;
    const missingRoleService = new RequestsService(
      missingRoleDb,
      app.get(CanonicalClientService),
      app.get(NotificationsService),
      app.get(SalesAssignmentService),
    );

    await expect(
      missingRoleService.createCrmIntake("user-id", {
        mode: "new",
        services: [{ serviceId: "svc-branding" }],
        newClient: {
          companyName: "Company",
          contactName: "Contact",
          phoneWhatsapp: "+966500000097",
          email: "new-role-test@example.com",
          password: "password123",
          businessName: "Business",
          businessType: BusinessType.SERVICE,
        },
      } as any),
    ).rejects.toMatchObject({ response: { code: "CLIENT_ROLE_NOT_FOUND" } });
  });

  test("maps CRM create failures and missing canonical clients to stable codes", async () => {
    const app = await getApp();
    const seededClient = {
      id: "client-id",
      companyName: "Existing Company",
      businessName: "Existing Business",
      businessType: BusinessType.SERVICE,
      accountManager: "manager-id",
      status: ClientStatus.LEAD,
      user: {
        name: "Existing Contact",
        phoneWhatsapp: "+966500000096",
        email: "existing@example.com",
      },
    };
    const failedCreateTransaction = {
      client: { findUnique: vi.fn().mockResolvedValue(seededClient) },
      request: {
        create: vi.fn().mockResolvedValue({ id: "request-id" }),
        findUnique: vi.fn().mockResolvedValue(null),
      },
      requestStatusHistory: { create: vi.fn().mockResolvedValue({}) },
      requestService: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
      clientHistoryLog: { create: vi.fn().mockResolvedValue({}) },
    } as any;
    const failedCreateDb = {
      $transaction: vi.fn((callback: (tx: any) => unknown) =>
        callback(failedCreateTransaction),
      ),
    } as any;
    const failedCreateService = new RequestsService(
      failedCreateDb,
      app.get(CanonicalClientService),
      app.get(NotificationsService),
      app.get(SalesAssignmentService),
    );

    await expect(
      failedCreateService.createCrmIntake("user-id", {
        mode: "existing",
        existingClient: { clientId: seededClient.id },
        services: [{ serviceId: "svc-branding" }],
      } as any),
    ).rejects.toMatchObject({ response: { code: "REQUEST_CREATE_FAILED" } });

    const canonicalMissingTransaction = {
      role: { findFirst: vi.fn().mockResolvedValue({ id: "role-id" }) },
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "new-user-id" }),
      },
    } as any;
    const canonicalMissingDb = {
      $transaction: vi.fn((callback: (tx: any) => unknown) =>
        callback(canonicalMissingTransaction),
      ),
    } as any;
    const canonicalMissingService = new RequestsService(
      canonicalMissingDb,
      { upsertCanonicalClient: vi.fn().mockResolvedValue(null) } as any,
      app.get(NotificationsService),
      app.get(SalesAssignmentService),
    );

    await expect(
      canonicalMissingService.createCrmIntake("user-id", {
        mode: "new",
        services: [{ serviceId: "svc-branding" }],
        newClient: {
          companyName: "Canonical Missing Company",
          contactName: "Canonical Missing Contact",
          phoneWhatsapp: "+966500000095",
          email: "canonical-missing@example.com",
          password: "password123",
          businessName: "Canonical Missing Business",
          businessType: BusinessType.SERVICE,
        },
      } as any),
    ).rejects.toMatchObject({
      response: { code: "REQUEST_CANONICAL_NOT_FOUND" },
    });
  });

  test("preserves notification contract and isolates notification failure", async () => {
    const app = await getApp();
    const admin = await loginAs(app, "admin@hassad.com", "password123");
    const prisma = getPrisma();
    const notificationsService = app.get(NotificationsService);
    const notifySpy = vi.spyOn(notificationsService, "notifyUsersWithMessage");

    const successRequest = await createPortalRequest(app, admin.accessToken);
    expect(notifySpy).toHaveBeenCalledOnce();
    const notificationParams = notifySpy.mock.calls[0][0];
    expect(notificationParams).toMatchObject({
      userIds: [successRequest.assignee.id],
      messageKey: "request.submitted",
      entityId: successRequest.id,
      entityType: "request",
      eventType: "REQUEST_SUBMITTED",
    });
    expect(notificationParams.metadata).toBeUndefined();

    const event = await prisma.notificationEvent.findFirstOrThrow({
      where: {
        entityId: successRequest.id,
        entityType: "request",
        eventType: "REQUEST_SUBMITTED",
      },
      include: { notifications: { select: { userId: true } } },
    });
    expect(event.metadata).toBeNull();
    expect(
      event.notifications.map((notification) => notification.userId),
    ).toEqual([successRequest.assignee.id]);

    notifySpy.mockReset();
    notifySpy.mockRejectedValue({ message: "notification unavailable" });
    const isolatedRequest = await createPortalRequest(app, admin.accessToken);
    expect(isolatedRequest.id).toBeTruthy();

    const persistedRequest = await prisma.request.findUniqueOrThrow({
      where: { id: isolatedRequest.id },
      select: { status: true },
    });
    expect(persistedRequest.status).toBe(RequestStatus.SUBMITTED);
    await expect(
      prisma.requestStatusHistory.count({
        where: { requestId: isolatedRequest.id },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.notificationEvent.findFirst({
        where: { entityId: isolatedRequest.id },
      }),
    ).resolves.toBeNull();

    notifySpy.mockRestore();
  });
});
