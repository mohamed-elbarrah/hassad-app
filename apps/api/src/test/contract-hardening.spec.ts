import { describe, expect, test, vi } from "vitest";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ContractsController } from "../modules/contracts/controllers/contracts.controller";
import { ContractsService } from "../modules/contracts/services/contracts.service";
import { ContractCronService } from "../modules/contracts/services/contract-cron.service";
import { BillingCronService } from "../modules/contracts/services/billing-cron.service";
import { ContractPaymentPlanService } from "../modules/contracts/services/contract-payment-plan.service";
import { CreateContractDto } from "../modules/contracts/dto/contract.dto";
import {
  contractAlreadyConverted,
  contractCommercialTermsImmutable,
  contractNotConvertible,
  contractTotalInvalid,
  contractPaymentPlanSequenceDuplicate,
  contractProposalRequired,
  contractRequestRequired,
} from "../modules/contracts/errors/contract-errors";

function expectDomainError(error: any, status: number, code: string) {
  expect(error.getStatus()).toBe(status);
  expect(error.getResponse()).toMatchObject({ code });
}

function createController() {
  return new ContractsController(
    { create: vi.fn(), createVersion: vi.fn() } as any,
    {} as any,
    { upload: vi.fn(), uploadForSubEntity: vi.fn() } as any,
  );
}

function createPaymentPlanService(overrides: Record<string, unknown> = {}) {
  return new ContractPaymentPlanService({
    contract: {
      findUnique: vi.fn().mockResolvedValue({
        id: "contract-id",
        totalValue: 1000,
        status: "SENT",
      }),
    },
    contractPaymentPlan: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({ _max: { sequence: null } }),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
      callback({
        contract: {
          findUnique: vi.fn().mockResolvedValue({
            id: "contract-id",
            totalValue: 1000,
            status: "SENT",
          }),
        },
        contractPaymentPlan: {
          createMany: vi.fn(),
          count: vi.fn().mockResolvedValue(0),
          findFirst: vi.fn().mockResolvedValue(null),
          aggregate: vi.fn().mockResolvedValue({ _max: { sequence: null } }),
          create: vi.fn(),
          update: vi.fn(),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUnique: vi.fn().mockResolvedValue({ id: "row-id" }),
        },
      }),
    ),
    ...overrides,
  } as any);
}

describe("Contracts hardening", () => {
  test("provides stable handoff helpers for all currently unmapped contract codes", () => {
    const cases = [
      [
        contractNotConvertible({
          currentStatus: "DRAFT",
          requiredStatus: "SIGNED",
        }),
        400,
        "CONTRACT_NOT_CONVERTIBLE",
      ],
      [
        contractAlreadyConverted({ contractId: "contract-id" }),
        409,
        "CONTRACT_ALREADY_CONVERTED",
      ],
      [
        contractRequestRequired({ field: "requestId" }),
        400,
        "CONTRACT_REQUEST_REQUIRED",
      ],
      [
        contractProposalRequired({ field: "proposalId" }),
        400,
        "CONTRACT_PROPOSAL_REQUIRED",
      ],
      [
        contractPaymentPlanSequenceDuplicate({
          field: "sequence",
          sequence: 1,
          rowIndexes: [0, 1],
        }),
        400,
        "CONTRACT_PAYMENT_PLAN_SEQUENCE_DUPLICATE",
      ],
      [
        contractCommercialTermsImmutable({ contractId: "contract-id" }),
        409,
        "CONTRACT_COMMERCIAL_TERMS_IMMUTABLE",
      ],
      [
        contractTotalInvalid({ field: "totalValue", value: -1, minimum: 0 }),
        400,
        "CONTRACT_TOTAL_INVALID",
      ],
    ] as const;

    for (const [error, status, code] of cases) {
      expectDomainError(error, status, code);
      expect((error.getResponse() as any).details).not.toHaveProperty("label");
    }
  });

  test("does not truncate malformed scalar numeric strings", async () => {
    const dto = plainToInstance(CreateContractDto, {
      requestId: "00000000-0000-0000-0000-000000000001",
      title: "Contract",
      type: "FIXED_PROJECT",
      totalValue: "1000abc",
      monthlyValue: "10.5xyz",
      downPaymentValue: "20percent",
      numberOfMonths: "12months",
    });
    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining([
        "totalValue",
        "monthlyValue",
        "downPaymentValue",
        "numberOfMonths",
      ]),
    );
  });

  test("rejects negative contract totals at DTO validation", async () => {
    const dto = plainToInstance(CreateContractDto, {
      requestId: "00000000-0000-0000-0000-000000000001",
      title: "Contract",
      type: "FIXED_PROJECT",
      totalValue: -1,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain("totalValue");
  });

  test("rejects non-finite payment-plan values with structured domain errors", async () => {
    const service = createPaymentPlanService();
    for (const amountValue of [Number.NaN, Number.POSITIVE_INFINITY, "10abc"]) {
      await expect(
        service.definePlan("contract-id", {
          rows: [
            {
              label: "Invalid amount",
              triggerType: "PERIOD_END",
              amountType: "FIXED",
              amountValue,
            },
          ],
        } as any),
      ).rejects.toSatisfy((error: unknown) => {
        expectDomainError(error, 400, "CONTRACT_PAYMENT_PLAN_AMOUNT_INVALID");
        expect((error as any).getResponse().details).toMatchObject({
          field: "amountValue",
        });
        return true;
      });
    }
  });

  test("rejects invalid sequence values with structured details", async () => {
    const service = createPaymentPlanService();
    await expect(
      service.definePlan("contract-id", {
        rows: [
          {
            label: "Invalid sequence",
            triggerType: "PERIOD_END",
            amountType: "FIXED",
            amountValue: 10,
            sequence: Number.POSITIVE_INFINITY,
          },
        ],
      } as any),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(error, 400, "CONTRACT_PAYMENT_PLAN_SEQUENCE_INVALID");
      expect((error as any).getResponse().details).toMatchObject({
        field: "sequence",
        integer: true,
      });
      return true;
    });
  });

  test("maps missing contract PDFs to stable domain errors", async () => {
    const controller = createController();

    await expect(
      controller.create({ id: "user-id" }, {} as any),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(error, 400, "CONTRACT_PDF_REQUIRED");
      return true;
    });

    await expect(
      controller.createVersion(
        "contract-id",
        { id: "user-id" },
        undefined as any,
        {} as any,
      ),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(error, 400, "CONTRACT_VERSION_PDF_REQUIRED");
      return true;
    });
  });

  test("maps missing payment-plan contracts and rows", async () => {
    const service = createPaymentPlanService({
      contract: { findUnique: vi.fn().mockResolvedValue(null) },
    });

    await expect(service.getPlan("missing-contract")).rejects.toSatisfy(
      (error: unknown) => {
        expectDomainError(error, 404, "CONTRACT_NOT_FOUND");
        return true;
      },
    );

    const rowService = createPaymentPlanService({
      contractPaymentPlan: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    });
    await expect(
      rowService.updateRow("contract-id", "missing-row", {} as any),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(error, 404, "CONTRACT_PAYMENT_PLAN_ROW_NOT_FOUND");
      return true;
    });
    await expect(
      rowService.removeRow("contract-id", "missing-row"),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(error, 404, "CONTRACT_PAYMENT_PLAN_ROW_NOT_FOUND");
      return true;
    });
  });

  test.each([
    {
      name: "duplicate down payment",
      rows: [
        {
          label: "First",
          triggerType: "ON_SIGN",
          amountType: "FIXED",
          amountValue: 100,
        },
        {
          label: "Second",
          triggerType: "ON_SIGN",
          amountType: "FIXED",
          amountValue: 100,
        },
      ],
      code: "CONTRACT_PAYMENT_PLAN_DOWN_PAYMENT_DUPLICATE",
      details: { field: "triggerType", triggerType: "ON_SIGN", maximum: 1 },
    },
    {
      name: "invalid percentage",
      rows: [
        {
          label: "Invalid percentage",
          triggerType: "ON_SIGN",
          amountType: "PERCENT",
          amountValue: 101,
        },
      ],
      code: "CONTRACT_PAYMENT_PLAN_PERCENT_INVALID",
      details: {
        field: "amountValue",
        amountType: "PERCENT",
        minimum: 0,
        maximum: 100,
        value: 101,
      },
    },
    {
      name: "invalid fixed amount",
      rows: [
        {
          label: "Invalid fixed",
          triggerType: "PERIOD_END",
          amountType: "FIXED",
          amountValue: -1,
        },
      ],
      code: "CONTRACT_PAYMENT_PLAN_AMOUNT_INVALID",
      details: {
        field: "amountValue",
        amountType: "FIXED",
        minimum: 0,
        value: -1,
      },
    },
    {
      name: "down payment exceeds total",
      rows: [
        {
          label: "Too large",
          triggerType: "ON_SIGN",
          amountType: "FIXED",
          amountValue: 1001,
        },
      ],
      code: "CONTRACT_PAYMENT_PLAN_DOWN_PAYMENT_EXCEEDS_TOTAL",
      details: {
        field: "amountValue",
        amountType: "FIXED",
        triggerType: "ON_SIGN",
        value: 1001,
        totalValue: 1000,
      },
    },
  ])(
    "returns structured details for $name",
    async ({ rows, code, details }) => {
      const service = createPaymentPlanService();

      await expect(
        service.definePlan("contract-id", { rows } as any),
      ).rejects.toSatisfy((error: unknown) => {
        expectDomainError(error, 400, code);
        expect((error as any).getResponse().details).toMatchObject(details);
        expect((error as any).getResponse().message).toEqual(
          expect.any(String),
        );
        return true;
      });
    },
  );

  test("rejects a second ON_SIGN row when adding or updating a row", async () => {
    const db = {
      contract: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: "contract-id", totalValue: 1000 }),
      },
      contractPaymentPlan: {
        count: vi.fn().mockResolvedValue(1),
        findFirst: vi.fn().mockResolvedValue({
          id: "row-id",
          contractId: "contract-id",
          sequence: 0,
          isRecurring: false,
          dueOffsetDays: 0,
          contract: { totalValue: 1000 },
        }),
      },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
        callback({
          contractPaymentPlan: {
            count: vi.fn().mockResolvedValue(1),
            findFirst: vi.fn().mockResolvedValue({
              id: "row-id",
              contractId: "contract-id",
              sequence: 0,
              isRecurring: false,
              dueOffsetDays: 0,
            }),
            aggregate: vi.fn().mockResolvedValue({ _max: { sequence: 0 } }),
            create: vi.fn(),
            update: vi.fn(),
          },
        }),
      ),
    };
    const service = createPaymentPlanService(db);
    const row = {
      label: "Second down payment",
      triggerType: "ON_SIGN",
      amountType: "FIXED",
      amountValue: 100,
    };

    await expect(service.addRow("contract-id", row as any)).rejects.toSatisfy(
      (error: unknown) => {
        expectDomainError(
          error,
          400,
          "CONTRACT_PAYMENT_PLAN_DOWN_PAYMENT_DUPLICATE",
        );
        return true;
      },
    );
    await expect(
      service.updateRow("contract-id", "row-id", row as any),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(
        error,
        400,
        "CONTRACT_PAYMENT_PLAN_DOWN_PAYMENT_DUPLICATE",
      );
      return true;
    });
  });

  test("deactivates payment-plan rows instead of deleting them", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const deleteRow = vi.fn();
    const service = createPaymentPlanService({
      contractPaymentPlan: {
        findFirst: vi.fn().mockResolvedValue({
          id: "row-id",
          contractId: "contract-id",
          isActive: true,
        }),
        delete: deleteRow,
      },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
        callback({
          $queryRaw: vi.fn(),
          contractPaymentPlan: {
            findFirst: vi.fn().mockResolvedValue({
              id: "row-id",
              contractId: "contract-id",
              isActive: true,
            }),
            updateMany,
            findUnique: vi.fn().mockResolvedValue({
              id: "row-id",
              contractId: "contract-id",
              isActive: false,
            }),
          },
        }),
      ),
    });

    await service.removeRow("contract-id", "row-id");

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "row-id", contractId: "contract-id", isActive: true },
      data: { isActive: false },
    });
    expect(deleteRow).not.toHaveBeenCalled();
  });

  test("preserves old plans and creates a deterministic active replacement", async () => {
    const deactivate = vi.fn();
    const createMany = vi.fn();
    const findMany = vi.fn().mockResolvedValue([]);
    const service = createPaymentPlanService({
      contractPaymentPlan: {
        findMany,
      },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
        callback({
          contractPaymentPlan: {
            updateMany: deactivate,
            createMany,
          },
        }),
      ),
    });

    await service.definePlan("contract-id", {
      rows: [
        {
          label: "Second",
          triggerType: "PERIOD_END",
          amountType: "FIXED",
          amountValue: 200,
          sequence: 1,
        },
        {
          label: "First",
          triggerType: "ON_SIGN",
          amountType: "FIXED",
          amountValue: 100,
        },
      ],
    } as any);

    expect(deactivate).toHaveBeenCalledWith({
      where: { contractId: "contract-id", isActive: true },
      data: { isActive: false },
    });
    expect(createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ sequence: 1, isActive: true }),
        expect.objectContaining({ sequence: 0, isActive: true }),
      ],
    });
    expect(findMany).toHaveBeenCalledWith({
      where: { contractId: "contract-id", isActive: true },
      orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
    });
  });

  test("rejects duplicate payment-plan sequences with safe details", async () => {
    const service = createPaymentPlanService();

    await expect(
      service.definePlan("contract-id", {
        rows: [
          {
            label: "First",
            triggerType: "PERIOD_END",
            amountType: "FIXED",
            amountValue: 100,
            sequence: 1,
          },
          {
            label: "Second",
            triggerType: "PERIOD_END",
            amountType: "FIXED",
            amountValue: 200,
            sequence: 1,
          },
        ],
      } as any),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(error, 400, "CONTRACT_PAYMENT_PLAN_SEQUENCE_DUPLICATE");
      expect((error as any).getResponse().details).toMatchObject({
        field: "sequence",
        sequence: 1,
        rowIndexes: [0, 1],
      });
      return true;
    });
  });

  test("rejects duplicate active sequences when adding or updating a row", async () => {
    const transaction = vi.fn(async (callback: (tx: any) => unknown) =>
      callback({
        contractPaymentPlan: {
          count: vi.fn().mockResolvedValue(0),
          findFirst: vi.fn().mockResolvedValue({ id: "existing-row" }),
          aggregate: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
        },
      }),
    );
    const service = createPaymentPlanService({
      $transaction: transaction,
      contract: {
        findUnique: vi.fn().mockResolvedValue({
          id: "contract-id",
          totalValue: 1000,
        }),
      },
      contractPaymentPlan: {
        findFirst: vi.fn().mockResolvedValue({
          id: "row-id",
          contractId: "contract-id",
          sequence: 0,
          isRecurring: false,
          dueOffsetDays: 0,
          contract: { totalValue: 1000 },
        }),
      },
    });
    const row = {
      label: "Duplicate sequence",
      sequence: 1,
      triggerType: "PERIOD_END",
      amountType: "FIXED",
      amountValue: 100,
    };

    await expect(service.addRow("contract-id", row as any)).rejects.toSatisfy(
      (error: unknown) => {
        expectDomainError(
          error,
          400,
          "CONTRACT_PAYMENT_PLAN_SEQUENCE_DUPLICATE",
        );
        return true;
      },
    );
    await expect(
      service.updateRow("contract-id", "row-id", row as any),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(error, 400, "CONTRACT_PAYMENT_PLAN_SEQUENCE_DUPLICATE");
      return true;
    });
  });

  test("does not update or deactivate a row belonging to another contract", async () => {
    const updateMany = vi.fn();
    const transaction = vi.fn(async (callback: (tx: any) => unknown) =>
      callback({
        contractPaymentPlan: {
          findFirst: vi.fn().mockResolvedValue(null),
          updateMany,
        },
      }),
    );
    const service = createPaymentPlanService({
      $transaction: transaction,
      contractPaymentPlan: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    });

    await expect(
      service.updateRow("contract-a", "row-from-contract-b", {
        label: "Row",
        triggerType: "PERIOD_END",
        amountType: "FIXED",
        amountValue: 10,
      } as any),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(error, 404, "CONTRACT_PAYMENT_PLAN_ROW_NOT_FOUND");
      return true;
    });
    await expect(
      service.removeRow("contract-a", "row-from-contract-b"),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(error, 404, "CONTRACT_PAYMENT_PLAN_ROW_NOT_FOUND");
      return true;
    });
    expect(updateMany).not.toHaveBeenCalled();
  });

  test("validates scalar down-payment bounds before contract creation", async () => {
    const transaction = vi.fn();
    const service = new ContractsService(
      {
        proposal: { findUnique: vi.fn() },
        $transaction: transaction,
        user: { findUnique: vi.fn().mockResolvedValue({ name: "Actor" }) },
        client: { findUnique: vi.fn().mockResolvedValue(null) },
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      createPaymentPlanService(),
      {} as any,
      {} as any,
    );

    await expect(
      service.create("user-id", "contract.pdf", {
        requestId: "request-id",
        title: "Contract",
        type: "MONTHLY_RETAINER",
        totalValue: 1000,
        downPaymentType: "PERCENT",
        downPaymentValue: 101,
      } as any),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(error, 400, "CONTRACT_PAYMENT_PLAN_PERCENT_INVALID");
      return true;
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  test.each([
    [
      "negative fixed amount",
      "FIXED",
      -1,
      "CONTRACT_PAYMENT_PLAN_AMOUNT_INVALID",
    ],
    [
      "fixed amount above total",
      "FIXED",
      1001,
      "CONTRACT_PAYMENT_PLAN_DOWN_PAYMENT_EXCEEDS_TOTAL",
    ],
  ])(
    "rejects scalar %s with the payment-plan domain code",
    async (_name, downPaymentType, downPaymentValue, code) => {
      const service = new ContractsService(
        { proposal: { findUnique: vi.fn() }, $transaction: vi.fn() } as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        createPaymentPlanService(),
        {} as any,
        {} as any,
      );

      await expect(
        service.create("user-id", "contract.pdf", {
          requestId: "request-id",
          title: "Contract",
          type: "MONTHLY_RETAINER",
          totalValue: 1000,
          downPaymentType,
          downPaymentValue,
        } as any),
      ).rejects.toSatisfy((error: unknown) => {
        expectDomainError(error, 400, code);
        return true;
      });
    },
  );

  test("validates explicit payment-plan rows before contract creation", async () => {
    const transaction = vi.fn();
    const service = new ContractsService(
      { proposal: { findUnique: vi.fn() }, $transaction: transaction } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      createPaymentPlanService(),
      {} as any,
      {} as any,
    );

    await expect(
      service.create("user-id", "contract.pdf", {
        requestId: "request-id",
        title: "Contract",
        type: "FIXED_PROJECT",
        totalValue: 1000,
        paymentPlan: [
          {
            label: "First",
            triggerType: "PERIOD_END",
            amountType: "FIXED",
            amountValue: 100,
            sequence: 1,
          },
          {
            label: "Second",
            triggerType: "PERIOD_END",
            amountType: "FIXED",
            amountValue: 200,
            sequence: 1,
          },
        ],
      } as any),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(error, 400, "CONTRACT_PAYMENT_PLAN_SEQUENCE_DUPLICATE");
      return true;
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  test("writes initial DRAFT to SENT history in the creation transaction", async () => {
    const historyCreate = vi.fn();
    const updateStatus = vi.fn();
    const service = new ContractsService(
      {
        proposal: { findUnique: vi.fn() },
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback({
            contract: {
              create: vi.fn().mockResolvedValue({
                id: "contract-id",
                title: "Contract",
                totalValue: 1000,
              }),
              statusHistory: { create: historyCreate },
            },
            contractStatusHistory: { create: historyCreate },
            contractPaymentPlan: { create: vi.fn() },
          }),
        ),
      } as any,
      {
        createLocalizedNotification: vi.fn().mockResolvedValue(undefined),
      } as any,
      {
        resolveRequestContext: vi.fn().mockResolvedValue({
          id: "request-id",
          clientId: "client-id",
          client: { userId: "client-user-id" },
          submittedBy: "client-user-id",
        }),
        updateStatus,
      } as any,
      {} as any,
      {} as any,
      {} as any,
      { getOnSignRow: vi.fn().mockResolvedValue(null) } as any,
      {} as any,
      {} as any,
    );

    await service.create("user-id", "contract.pdf", {
      requestId: "request-id",
      title: "Contract",
      type: "FIXED_PROJECT",
      totalValue: 1000,
    } as any);

    expect(historyCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contractId: "contract-id",
        fromStatus: "DRAFT",
        toStatus: "SENT",
        changedBy: "user-id",
      }),
    });
  });

  test("creates share-link signing notifications only after the transaction commits", async () => {
    let committed = false;
    const notifications = {
      createLocalizedNotification: vi.fn(async () => {
        expect(committed).toBe(true);
      }),
      notifyUsersWithMessage: vi.fn(),
    };
    const prisma = {
      contract: {
        findUnique: vi.fn().mockResolvedValue({
          id: "contract-id",
          status: "SENT",
          createdBy: "creator-id",
          requestId: null,
          clientId: "client-id",
          title: "Contract",
          client: { userId: "client-user-id" },
          request: null,
        }),
      },
      client: {
        findUnique: vi.fn().mockResolvedValue({ userId: "client-user-id" }),
      },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) => {
        const result = await callback({
          contract: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            findUnique: vi
              .fn()
              .mockResolvedValue({ id: "contract-id", status: "SIGNED" }),
          },
          contractStatusHistory: { create: vi.fn() },
        });
        committed = true;
        return result;
      }),
    };
    const service = new ContractsService(
      prisma as any,
      notifications as any,
      {} as any,
      {} as any,
      {} as any,
      { onContractSigned: vi.fn().mockResolvedValue(undefined) } as any,
      {
        getOnSignRow: vi.fn().mockResolvedValue(null),
        resolveAmount: vi.fn(),
      } as any,
      {} as any,
      {} as any,
    );
    vi.spyOn(service as any, "onContractSigned").mockResolvedValue(undefined);

    await service.signByToken("share-token", { signedByName: "Client" } as any);

    expect(notifications.createLocalizedNotification).toHaveBeenCalledTimes(2);
  });

  test("records a status history row when sending a contract", async () => {
    const historyCreate = vi.fn();
    const prisma = {
      contract: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      user: { findUnique: vi.fn().mockResolvedValue({ name: "Sales" }) },
      client: { findUnique: vi.fn().mockResolvedValue(null) },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
        callback({
          contract: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            findUnique: vi
              .fn()
              .mockResolvedValue({ id: "contract-id", status: "SENT" }),
          },
          contractStatusHistory: { create: historyCreate },
        }),
      ),
    };
    const service = new ContractsService(
      prisma as any,
      {
        notifyUsersWithMessage: vi
          .fn()
          .mockRejectedValue(new Error("notification unavailable")),
      } as any,
      { updateStatus: vi.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    vi.spyOn(service, "findOne").mockResolvedValue({
      id: "contract-id",
      status: "DRAFT",
      createdBy: "creator-id",
      clientId: "client-id",
      requestId: null,
      title: "Contract",
      client: { accountManager: null, companyName: "Company" },
    } as any);

    await service.send("contract-id", "actor-id");

    expect(historyCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contractId: "contract-id",
        fromStatus: "DRAFT",
        toStatus: "SENT",
        changedBy: "actor-id",
      }),
    });
  });

  test("rejects repeated sends and updates the related request atomically", async () => {
    const updateStatus = vi.fn();
    const historyCreate = vi.fn();
    const transaction = vi.fn(async (callback: (tx: any) => unknown) =>
      callback({
        contract: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUnique: vi
            .fn()
            .mockResolvedValue({ id: "contract-id", status: "SENT" }),
        },
        contractStatusHistory: { create: historyCreate },
      }),
    );
    const service = new ContractsService(
      {
        $transaction: transaction,
        user: { findUnique: vi.fn().mockResolvedValue({ name: "Actor" }) },
        client: { findUnique: vi.fn().mockResolvedValue(null) },
      } as any,
      { notifyUsersWithMessage: vi.fn().mockResolvedValue(undefined) } as any,
      { updateStatus } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    vi.spyOn(service, "findOne")
      .mockResolvedValueOnce({
        id: "contract-id",
        status: "DRAFT",
        createdBy: "creator-id",
        clientId: "client-id",
        requestId: "request-id",
        title: "Contract",
        client: { accountManager: null, companyName: "Company" },
      } as any)
      .mockResolvedValueOnce({
        id: "contract-id",
        status: "SENT",
        createdBy: "creator-id",
        clientId: "client-id",
        requestId: "request-id",
        title: "Contract",
        client: { accountManager: null, companyName: "Company" },
      } as any);

    await service.send("contract-id", "actor-id");
    expect(updateStatus).toHaveBeenCalledWith(
      "request-id",
      "CONTRACT_SENT",
      "actor-id",
      undefined,
      expect.anything(),
    );
    expect(transaction).toHaveBeenCalledOnce();

    await expect(service.send("contract-id", "actor-id")).rejects.toSatisfy(
      (error: unknown) => {
        expectDomainError(error, 400, "CONTRACT_INVALID_STATUS_TRANSITION");
        return true;
      },
    );
    expect(transaction).toHaveBeenCalledOnce();
  });

  test("rolls back send when the related request transition fails", async () => {
    const requestError = new Error("request transition failed");
    const notifications = {
      notifyUsersWithMessage: vi.fn().mockResolvedValue(undefined),
    };
    const transaction = vi.fn(async (callback: (tx: any) => unknown) =>
      callback({
        contract: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUnique: vi
            .fn()
            .mockResolvedValue({ id: "contract-id", status: "SENT" }),
        },
        contractStatusHistory: { create: vi.fn() },
      }),
    );
    const service = new ContractsService(
      {
        $transaction: transaction,
        user: { findUnique: vi.fn().mockResolvedValue({ name: "Actor" }) },
        client: { findUnique: vi.fn().mockResolvedValue(null) },
      } as any,
      notifications as any,
      { updateStatus: vi.fn().mockRejectedValue(requestError) } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    vi.spyOn(service, "findOne").mockResolvedValue({
      id: "contract-id",
      status: "DRAFT",
      createdBy: "creator-id",
      clientId: "client-id",
      requestId: "request-id",
      title: "Contract",
      client: { accountManager: null, companyName: "Company" },
    } as any);

    await expect(service.send("contract-id", "actor-id")).rejects.toBe(
      requestError,
    );
    expect(notifications.notifyUsersWithMessage).not.toHaveBeenCalled();
  });

  test("rejects repeated cancellation and transitions request inside its transaction", async () => {
    const updateStatus = vi.fn();
    const transaction = vi.fn(async (callback: (tx: any) => unknown) =>
      callback({
        contract: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUnique: vi
            .fn()
            .mockResolvedValue({ id: "contract-id", status: "CANCELLED" }),
        },
        contractStatusHistory: { create: vi.fn() },
      }),
    );
    const service = new ContractsService(
      {
        $transaction: transaction,
        user: { findUnique: vi.fn().mockResolvedValue({ name: "Actor" }) },
        client: { findUnique: vi.fn().mockResolvedValue(null) },
      } as any,
      { notifyUsersWithMessage: vi.fn().mockResolvedValue(undefined) } as any,
      { updateStatus } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    vi.spyOn(service, "findOne")
      .mockResolvedValueOnce({
        id: "contract-id",
        status: "SENT",
        createdBy: "creator-id",
        clientId: "client-id",
        requestId: "request-id",
        title: "Contract",
        client: { accountManager: null, companyName: "Company" },
      } as any)
      .mockResolvedValueOnce({
        id: "contract-id",
        status: "CANCELLED",
        createdBy: "creator-id",
        clientId: "client-id",
        requestId: "request-id",
        title: "Contract",
        client: { accountManager: null, companyName: "Company" },
      } as any);

    await service.cancel("contract-id", "actor-id");
    expect(updateStatus).toHaveBeenCalledWith(
      "request-id",
      "CANCELLED",
      "actor-id",
      undefined,
      expect.anything(),
    );

    await expect(service.cancel("contract-id", "actor-id")).rejects.toSatisfy(
      (error: unknown) => {
        expectDomainError(error, 400, "CONTRACT_INVALID_STATUS_TRANSITION");
        return true;
      },
    );
    expect(transaction).toHaveBeenCalledOnce();
  });

  test("manual activation rejects an unpaid ON_SIGN requirement", async () => {
    const service = new ContractsService(
      {
        contract: {
          findUnique: vi.fn().mockResolvedValue({
            id: "contract-id",
            status: "SIGNED",
            title: "Contract",
            clientId: "client-id",
            createdBy: "creator-id",
            client: { accountManager: null },
          }),
        },
        invoice: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {
        getOnSignRow: vi.fn().mockResolvedValue({
          id: "plan-row-id",
          amountType: "FIXED",
          amountValue: 100,
        }),
        resolveAmount: vi.fn().mockReturnValue(100),
      } as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.activateContract("contract-id", "actor-id"),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(
        error,
        400,
        "CONTRACT_PAYMENT_PLAN_DOWN_PAYMENT_REQUIRED",
      );
      expect((error as any).getResponse().details).toMatchObject({
        contractId: "contract-id",
        paymentPlanId: "plan-row-id",
      });
      return true;
    });
  });

  test("does not accept an unrelated paid invoice for scalar down-payment activation", async () => {
    const service = new ContractsService(
      {
        contract: {
          findUnique: vi.fn().mockResolvedValue({
            id: "contract-id",
            status: "SIGNED",
            title: "Contract",
            clientId: "client-id",
            createdBy: "creator-id",
            totalValue: 1000,
            downPaymentType: "FIXED",
            downPaymentValue: 100,
            client: { accountManager: null },
          }),
        },
        invoice: {
          findFirst: vi
            .fn()
            .mockImplementation(({ where }: any) =>
              where.notes ===
              "Down-payment invoice required to activate the contract"
                ? null
                : { id: "unrelated-paid-invoice" },
            ),
        },
        $transaction: vi.fn(),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {
        getOnSignRow: vi.fn().mockResolvedValue(null),
        resolveAmount: vi.fn().mockReturnValue(100),
      } as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.activateContract("contract-id", "actor-id"),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(
        error,
        400,
        "CONTRACT_PAYMENT_PLAN_DOWN_PAYMENT_REQUIRED",
      );
      return true;
    });
  });

  test("activates a legacy scalar contract only for its marked paid invoice", async () => {
    const activateContract = vi
      .spyOn(ContractsService.prototype, "activateContract")
      .mockResolvedValue({ status: "ACTIVE" } as any);
    const service = new ContractsService(
      {
        invoice: {
          findUnique: vi.fn().mockResolvedValue({
            id: "invoice-id",
            contractId: "contract-id",
            paymentPlanId: null,
            amount: 100,
            notes: "Down-payment invoice required to activate the contract",
            contract: {
              totalValue: 1000,
              downPaymentType: "FIXED",
              downPaymentValue: 100,
            },
          }),
        },
        contract: {
          findUnique: vi.fn().mockResolvedValue({
            id: "contract-id",
            status: "SIGNED",
            createdBy: "creator-id",
          }),
        },
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {
        getOnSignRow: vi.fn().mockResolvedValue(null),
        resolveAmount: vi.fn().mockReturnValue(100),
      } as any,
      {} as any,
      {} as any,
    );

    await service.handleInvoicePaid({
      invoiceId: "invoice-id",
      contractId: "contract-id",
      userId: "actor-id",
    });

    expect(activateContract).toHaveBeenCalledWith(
      "contract-id",
      "actor-id",
      "Down payment received",
    );
    activateContract.mockRestore();
  });

  test("maps contract update dates and numeric values before persistence", async () => {
    const update = vi.fn().mockResolvedValue({ id: "contract-id" });
    const service = new ContractsService(
      {
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback({
            contract: {
              findUnique: vi.fn().mockResolvedValue({
                id: "contract-id",
                totalValue: 1000,
                downPaymentType: null,
                downPaymentValue: null,
              }),
              update,
            },
            contractPaymentPlan: { findMany: vi.fn().mockResolvedValue([]) },
          }),
        ),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      new ContractPaymentPlanService({} as any),
      {} as any,
      {} as any,
    );

    await service.update("contract-id", {
      monthlyValue: 125.5,
      totalValue: 1000,
      startDate: "2026-01-02T00:00:00.000Z",
      endDate: "2026-02-02T00:00:00.000Z",
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: "contract-id" },
      data: {
        monthlyValue: 125.5,
        totalValue: 1000,
        startDate: new Date("2026-01-02T00:00:00.000Z"),
        endDate: new Date("2026-02-02T00:00:00.000Z"),
      },
    });
  });

  test("rejects a total-value reduction below an active fixed down payment", async () => {
    const update = vi.fn();
    const service = new ContractsService(
      {
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback({
            contract: {
              findUnique: vi.fn().mockResolvedValue({
                id: "contract-id",
                totalValue: 1000,
                downPaymentType: null,
                downPaymentValue: null,
              }),
              update,
            },
            contractPaymentPlan: {
              findMany: vi.fn().mockResolvedValue([
                {
                  label: "Down payment",
                  sequence: 0,
                  triggerType: "ON_SIGN",
                  amountType: "FIXED",
                  amountValue: 800,
                },
              ]),
            },
          }),
        ),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      new ContractPaymentPlanService({} as any),
      {} as any,
      {} as any,
    );

    await expect(
      service.update("contract-id", { totalValue: 500 }),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(
        error,
        400,
        "CONTRACT_PAYMENT_PLAN_DOWN_PAYMENT_EXCEEDS_TOTAL",
      );
      expect((error as any).getResponse().details).toMatchObject({
        value: 800,
        totalValue: 500,
      });
      return true;
    });
    expect(update).not.toHaveBeenCalled();
  });

  test("rejects negative contract totals in the service without payment-plan rows", async () => {
    const update = vi.fn();
    const service = new ContractsService(
      {
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback({
            contract: {
              findUnique: vi.fn().mockResolvedValue({
                id: "contract-id",
                status: "SENT",
                totalValue: 1000,
                downPaymentType: null,
                downPaymentValue: null,
              }),
              update,
            },
            contractPaymentPlan: { findMany: vi.fn().mockResolvedValue([]) },
          }),
        ),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      new ContractPaymentPlanService({} as any),
      {} as any,
      {} as any,
    );

    await expect(
      service.update("contract-id", { totalValue: -1 }),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(error, 400, "CONTRACT_TOTAL_INVALID");
      expect((error as any).getResponse().details).toMatchObject({
        field: "totalValue",
        value: -1,
        minimum: 0,
      });
      return true;
    });
    expect(update).not.toHaveBeenCalled();
  });

  test("rejects contract total edits after signing or invoice issuance", async () => {
    const createService = (status: string, invoice: unknown) => {
      const update = vi.fn();
      const service = new ContractsService(
        {
          $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
            callback({
              contract: {
                findUnique: vi.fn().mockResolvedValue({
                  id: "contract-id",
                  status,
                  totalValue: 1000,
                  downPaymentType: null,
                  downPaymentValue: null,
                }),
                update,
              },
              contractPaymentPlan: { findMany: vi.fn().mockResolvedValue([]) },
              invoice: { findFirst: vi.fn().mockResolvedValue(invoice) },
            }),
          ),
        } as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        new ContractPaymentPlanService({} as any),
        {} as any,
        {} as any,
      );
      return { service, update };
    };

    for (const [status, invoice] of [
      ["SIGNED", null],
      ["SENT", { id: "invoice-id" }],
    ] as const) {
      const { service, update } = createService(status, invoice);
      await expect(
        service.update("contract-id", { totalValue: 900 }),
      ).rejects.toSatisfy((error: unknown) => {
        expectDomainError(error, 409, "CONTRACT_COMMERCIAL_TERMS_IMMUTABLE");
        return true;
      });
      expect(update).not.toHaveBeenCalled();
    }
  });

  test("allows contract total edits before signing and invoice issuance", async () => {
    const update = vi.fn().mockResolvedValue({ id: "contract-id" });
    const service = new ContractsService(
      {
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback({
            contract: {
              findUnique: vi.fn().mockResolvedValue({
                id: "contract-id",
                status: "SENT",
                totalValue: 1000,
                downPaymentType: null,
                downPaymentValue: null,
              }),
              update,
            },
            contractPaymentPlan: { findMany: vi.fn().mockResolvedValue([]) },
            invoice: { findFirst: vi.fn().mockResolvedValue(null) },
          }),
        ),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      new ContractPaymentPlanService({} as any),
      {} as any,
      {} as any,
    );

    await expect(
      service.update("contract-id", { totalValue: 900 }),
    ).resolves.toEqual({ id: "contract-id" });
    expect(update).toHaveBeenCalledOnce();
  });

  test("rejects every payment-plan edit after signing or invoice issuance", async () => {
    const createService = (status: string, invoice: unknown) =>
      createPaymentPlanService({
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback({
            $queryRaw: vi.fn(),
            contract: {
              findUnique: vi.fn().mockResolvedValue({
                id: "contract-id",
                totalValue: 1000,
                status,
              }),
            },
            invoice: { findFirst: vi.fn().mockResolvedValue(invoice) },
            contractPaymentPlan: {
              count: vi.fn().mockResolvedValue(0),
              findFirst: vi.fn().mockResolvedValue({
                id: "row-id",
                contractId: "contract-id",
                sequence: 0,
                isActive: true,
                isRecurring: false,
                dueOffsetDays: 0,
              }),
              aggregate: vi.fn().mockResolvedValue({ _max: { sequence: 0 } }),
              updateMany: vi.fn().mockResolvedValue({ count: 1 }),
              create: vi.fn(),
              createMany: vi.fn(),
              findUnique: vi.fn().mockResolvedValue({ id: "row-id" }),
            },
          }),
        ),
      });
    const row = {
      label: "Down payment",
      sequence: 0,
      triggerType: "ON_SIGN",
      amountType: "FIXED",
      amountValue: 100,
    };

    for (const [status, invoice] of [
      ["SIGNED", null],
      ["SENT", { id: "invoice-id" }],
    ] as const) {
      const service = createService(status, invoice);
      await expect(
        service.definePlan("contract-id", { rows: [row] } as any),
      ).rejects.toSatisfy((error: unknown) => {
        expectDomainError(error, 409, "CONTRACT_COMMERCIAL_TERMS_IMMUTABLE");
        return true;
      });
      await expect(service.addRow("contract-id", row as any)).rejects.toSatisfy(
        (error: unknown) => {
          expectDomainError(error, 409, "CONTRACT_COMMERCIAL_TERMS_IMMUTABLE");
          return true;
        },
      );
      await expect(
        service.updateRow("contract-id", "row-id", row as any),
      ).rejects.toSatisfy((error: unknown) => {
        expectDomainError(error, 409, "CONTRACT_COMMERCIAL_TERMS_IMMUTABLE");
        return true;
      });
      await expect(
        service.removeRow("contract-id", "row-id"),
      ).rejects.toSatisfy((error: unknown) => {
        expectDomainError(error, 409, "CONTRACT_COMMERCIAL_TERMS_IMMUTABLE");
        return true;
      });
    }
  });

  test("isolates activation and signing notification failures", async () => {
    const notifyUsersWithMessage = vi
      .fn()
      .mockRejectedValue(new Error("notification unavailable"));
    const eventEmitter = { emit: vi.fn() };
    const activationPrisma = {
      contract: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({
            id: "contract-id",
            status: "SIGNED",
            title: "Contract",
            clientId: "client-id",
            createdBy: "creator-id",
            client: { accountManager: null },
          })
          .mockResolvedValueOnce({ type: "FIXED_PROJECT" }),
      },
      client: { findUnique: vi.fn().mockResolvedValue({ userId: null }) },
      project: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({ projectManagerId: "pm-id" })
          .mockResolvedValueOnce({ id: "project-id" }),
      },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
        callback({
          contract: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            findUnique: vi.fn().mockResolvedValue({ status: "ACTIVE" }),
          },
          contractStatusHistory: { create: vi.fn() },
          project: { updateMany: vi.fn() },
          client: { update: vi.fn() },
        }),
      ),
    };
    const activationService = new ContractsService(
      activationPrisma as any,
      { notifyUsersWithMessage } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { getOnSignRow: vi.fn().mockResolvedValue(null) } as any,
      {} as any,
      eventEmitter as any,
    );

    await expect(
      activationService.activateContract("contract-id", "actor-id"),
    ).resolves.toMatchObject({ status: "ACTIVE" });
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      "contract.activated",
      expect.objectContaining({ contractId: "contract-id" }),
    );

    const signService = new ContractsService(
      {
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback({
            contract: {
              updateMany: vi.fn().mockResolvedValue({ count: 1 }),
              findUnique: vi
                .fn()
                .mockResolvedValue({ id: "contract-id", status: "SIGNED" }),
            },
            contractStatusHistory: { create: vi.fn() },
          }),
        ),
      } as any,
      { notifyUsersWithMessage } as any,
      {} as any,
      {} as any,
      {} as any,
      { onContractSigned: vi.fn().mockResolvedValue(undefined) } as any,
      {} as any,
      {} as any,
      {} as any,
    );
    vi.spyOn(signService, "findOne").mockResolvedValue({
      id: "contract-id",
      status: "SENT",
      createdBy: "creator-id",
      requestId: null,
      title: "Contract",
      client: { accountManager: null, companyName: "Company" },
    } as any);
    vi.spyOn(signService as any, "onContractSigned").mockResolvedValue(
      undefined,
    );

    await expect(
      signService.sign("contract-id", "actor-id", {
        signedByName: "Staff",
      } as any),
    ).resolves.toMatchObject({ status: "SIGNED" });
  });

  test("allows only one concurrent signing transition and history row", async () => {
    let status = "SENT";
    const historyCreate = vi.fn();
    const service = new ContractsService(
      {
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback({
            contract: {
              updateMany: vi.fn(async ({ where }: any) => {
                if (status !== where.status) return { count: 0 };
                status = "SIGNED";
                return { count: 1 };
              }),
              findUnique: vi.fn().mockImplementation(async () => ({
                id: "contract-id",
                status,
              })),
            },
            contractStatusHistory: { create: historyCreate },
          }),
        ),
      } as any,
      { notifyUsersWithMessage: vi.fn().mockResolvedValue(undefined) } as any,
      {} as any,
      {} as any,
      {} as any,
      { onContractSigned: vi.fn().mockResolvedValue(undefined) } as any,
      {} as any,
      {} as any,
      {} as any,
    );
    vi.spyOn(service, "findOne").mockResolvedValue({
      id: "contract-id",
      status: "SENT",
      createdBy: "creator-id",
      requestId: null,
      title: "Contract",
      client: { accountManager: null, companyName: "Company" },
    } as any);
    vi.spyOn(service as any, "onContractSigned").mockResolvedValue(undefined);

    const results = await Promise.allSettled([
      service.sign("contract-id", "actor-a", { signedByName: "A" } as any),
      service.sign("contract-id", "actor-b", { signedByName: "B" } as any),
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    expect(historyCreate).toHaveBeenCalledOnce();
  });

  test("allows only one concurrent activation transition and history row", async () => {
    let status = "SIGNED";
    const historyCreate = vi.fn();
    const service = new ContractsService(
      {
        contract: {
          findUnique: vi.fn().mockImplementation(async ({ select }: any) =>
            select?.type
              ? { type: "FIXED_PROJECT" }
              : {
                  id: "contract-id",
                  status,
                  title: "Contract",
                  clientId: "client-id",
                  createdBy: "creator-id",
                  client: { accountManager: null },
                },
          ),
        },
        client: { findUnique: vi.fn().mockResolvedValue({ userId: null }) },
        project: {
          findFirst: vi
            .fn()
            .mockResolvedValueOnce({ projectManagerId: null })
            .mockResolvedValueOnce({ id: "project-id" }),
        },
        invoice: { findFirst: vi.fn().mockResolvedValue(null) },
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback({
            contract: {
              updateMany: vi.fn(async ({ where }: any) => {
                if (status !== where.status) return { count: 0 };
                status = "ACTIVE";
                return { count: 1 };
              }),
              findUnique: vi.fn().mockImplementation(async () => ({
                id: "contract-id",
                status,
              })),
            },
            contractStatusHistory: { create: historyCreate },
            project: { updateMany: vi.fn() },
            client: { update: vi.fn() },
          }),
        ),
      } as any,
      { notifyUsersWithMessage: vi.fn().mockResolvedValue(undefined) } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { getOnSignRow: vi.fn().mockResolvedValue(null) } as any,
      {} as any,
      { emit: vi.fn() } as any,
    );

    const results = await Promise.all([
      service.activateContract("contract-id", "actor-a"),
      service.activateContract("contract-id", "actor-b"),
    ]);

    expect(results).toHaveLength(2);
    expect(historyCreate).toHaveBeenCalledOnce();
  });

  test("allows only one concurrent send transition and history row", async () => {
    let status = "DRAFT";
    const historyCreate = vi.fn();
    const service = new ContractsService(
      {
        user: { findUnique: vi.fn().mockResolvedValue({ name: "Actor" }) },
        client: { findUnique: vi.fn().mockResolvedValue(null) },
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback({
            contract: {
              updateMany: vi.fn(async ({ where }: any) => {
                if (status !== where.status) return { count: 0 };
                status = "SENT";
                return { count: 1 };
              }),
              findUnique: vi
                .fn()
                .mockResolvedValue({ id: "contract-id", status }),
            },
            contractStatusHistory: { create: historyCreate },
          }),
        ),
      } as any,
      { notifyUsersWithMessage: vi.fn().mockResolvedValue(undefined) } as any,
      { updateStatus: vi.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    vi.spyOn(service, "findOne").mockResolvedValue({
      id: "contract-id",
      status: "DRAFT",
      createdBy: "creator-id",
      requestId: null,
      title: "Contract",
      client: { accountManager: null, companyName: "Company" },
    } as any);

    const results = await Promise.allSettled([
      service.send("contract-id", "actor-a"),
      service.send("contract-id", "actor-b"),
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    expect(historyCreate).toHaveBeenCalledOnce();
  });

  test("allows only one concurrent cancellation transition and history row", async () => {
    let status = "SENT";
    const historyCreate = vi.fn();
    const service = new ContractsService(
      {
        user: { findUnique: vi.fn().mockResolvedValue({ name: "Actor" }) },
        client: { findUnique: vi.fn().mockResolvedValue(null) },
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback({
            contract: {
              updateMany: vi.fn(async ({ where }: any) => {
                if (status !== where.status) return { count: 0 };
                status = "CANCELLED";
                return { count: 1 };
              }),
              findUnique: vi
                .fn()
                .mockResolvedValue({ id: "contract-id", status }),
            },
            contractStatusHistory: { create: historyCreate },
          }),
        ),
      } as any,
      { notifyUsersWithMessage: vi.fn().mockResolvedValue(undefined) } as any,
      { updateStatus: vi.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    vi.spyOn(service, "findOne").mockResolvedValue({
      id: "contract-id",
      status: "SENT",
      createdBy: "creator-id",
      requestId: null,
      title: "Contract",
      client: { accountManager: null, companyName: "Company" },
    } as any);

    const results = await Promise.allSettled([
      service.cancel("contract-id", "actor-a"),
      service.cancel("contract-id", "actor-b"),
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    expect(historyCreate).toHaveBeenCalledOnce();
  });

  test("uses English service-template fields during project handover", async () => {
    const deliverableCreate = vi.fn();
    const service = new ContractsService(
      {
        contract: {
          findUnique: vi.fn().mockResolvedValue({
            id: "contract-id",
            clientId: "client-id",
            createdBy: "creator-id",
            startDate: null,
            endDate: null,
            title: "Contract",
            client: {
              companyName: "Company",
              accountManager: null,
              user: { name: "Client" },
            },
            proposal: null,
            request: {
              services: [
                {
                  service: {
                    deliverableTemplates: [
                      {
                        titleAr: "Localized title",
                        title: "English title",
                        descriptionAr: "Localized description",
                        description: "English description",
                      },
                    ],
                  },
                },
              ],
            },
          }),
        },
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback({
            project: {
              findFirst: vi.fn().mockResolvedValue(null),
              create: vi
                .fn()
                .mockResolvedValue({ id: "project-id", name: "Project" }),
            },
            projectMember: { create: vi.fn() },
            deliverable: { create: deliverableCreate },
          }),
        ),
      } as any,
      {
        createLocalizedNotification: vi.fn().mockResolvedValue(undefined),
      } as any,
      { updateStatus: vi.fn() } as any,
      { getOrCreate: vi.fn().mockResolvedValue(undefined) } as any,
      {
        findBestPm: vi.fn().mockResolvedValue({
          pmId: "pm-id",
          pmName: "PM",
          currentLoad: 0,
          isFallback: false,
          isAccountManager: false,
        }),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await (service as any).createProjectFromSignedContract("contract-id");

    expect(deliverableCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "English title",
        description: "English description",
      }),
    });
  });

  test("maps project handover and missing-PM failures", async () => {
    const missingHandover = new ContractsService(
      { contract: { findUnique: vi.fn().mockResolvedValue(null) } } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    await expect(
      (missingHandover as any).createProjectFromSignedContract("contract-id"),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(error, 404, "CONTRACT_HANDOVER_NOT_FOUND");
      return true;
    });

    const missingPm = new ContractsService(
      {
        contract: {
          findUnique: vi.fn().mockResolvedValue({
            id: "contract-id",
            clientId: "client-id",
            createdBy: "creator-id",
            client: { accountManager: null },
          }),
        },
      } as any,
      {} as any,
      {} as any,
      {} as any,
      { findBestPm: vi.fn().mockResolvedValue(null) } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    await expect(
      (missingPm as any).createProjectFromSignedContract("contract-id"),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(error, 400, "CONTRACT_PM_REQUIRED");
      return true;
    });
  });

  test("records expiry history using the contract creator as a valid actor", async () => {
    const historyCreate = vi.fn();
    const prisma = {
      contract: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([
            {
              id: "contract-id",
              title: "Contract",
              createdBy: "creator-id",
              endDate: new Date(),
              client: {
                accountManager: null,
                userId: null,
                companyName: "Company",
              },
            },
          ])
          .mockResolvedValueOnce([
            {
              id: "expired-contract-id",
              title: "Expired contract",
              createdBy: "creator-id",
              status: "SIGNED",
              client: {
                accountManager: null,
                userId: null,
                companyName: "Company",
              },
            },
          ]),
        update: vi.fn(),
      },
      contractRenewalAlert: {
        findFirst: vi.fn().mockResolvedValue({ id: "alert-id" }),
        create: vi.fn().mockResolvedValue({ id: "alert-id", isSent: true }),
        updateMany: vi.fn(),
      },
      notificationEvent: { findFirst: vi.fn().mockResolvedValue(null) },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
        callback({
          contract: {
            update: vi.fn(),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          contractRenewalAlert: {
            findFirst: vi
              .fn()
              .mockResolvedValue({ id: "alert-id", isSent: false }),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            create: vi.fn().mockResolvedValue({ id: "escalation-alert" }),
          },
          notificationEvent: {
            findMany: vi.fn().mockResolvedValue([]),
            create: vi.fn().mockResolvedValue({ id: "claim-event" }),
            update: vi.fn(),
          },
          contractStatusHistory: { create: historyCreate },
        }),
      ),
    };
    const service = new ContractCronService(
      prisma as any,
      {
        notifyUsersWithMessage: vi
          .fn()
          .mockRejectedValue(new Error("notification unavailable")),
      } as any,
    );

    await service.handleExpiringContracts();

    expect(historyCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contractId: "expired-contract-id",
        toStatus: "EXPIRED",
        changedBy: "creator-id",
      }),
    });
  });

  test("uses a real contract user for automatic cancellation history", async () => {
    const historyCreate = vi.fn();
    const prisma = {
      companySetting: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      invoice: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "invoice-id",
            issueDate: new Date(0),
            paymentPlanId: "plan-id",
            paymentPlan: { triggerType: "ON_SIGN" },
            contract: {
              id: "contract-id",
              status: "SIGNED",
              title: "Contract",
              createdBy: "creator-id",
              client: { userId: null, accountManager: null },
            },
          },
        ]),
      },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
        callback({
          invoice: { update: vi.fn() },
          contract: {
            update: vi.fn(),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          contractStatusHistory: { create: historyCreate },
        }),
      ),
    };
    const service = new BillingCronService(
      prisma as any,
      {
        notifyUsersWithMessage: vi
          .fn()
          .mockRejectedValue(new Error("notification unavailable")),
      } as any,
      {} as any,
    );

    await (service as any).cancelUnpaidDownPayments();

    expect(historyCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contractId: "contract-id",
        changedBy: "creator-id",
        toStatus: "CANCELLED",
      }),
    });
  });

  test("does not suppress a reminder when an unrelated higher bit is set", async () => {
    const invoice = {
      id: "invoice-id",
      invoiceNumber: "INV-1",
      amount: 100,
      reminderFlags: 2,
      paymentPlanId: "plan-id",
      dueDate: new Date(),
      client: { userId: "client-user-id", companyName: "Company" },
      contract: { title: "Contract" },
    };
    const findMany = vi.fn().mockResolvedValue([invoice]);
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const notify = vi.fn().mockResolvedValue(undefined);
    const service = new BillingCronService(
      {
        companySetting: {
          findUnique: vi.fn().mockResolvedValue({ value: [0] }),
        },
        invoice: { findMany, updateMany },
      } as any,
      { createLocalizedNotification: notify } as any,
      {} as any,
    );

    await (service as any).sendReminders();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({
          reminderFlags: expect.anything(),
        }),
      }),
    );
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "invoice-id", reminderFlags: 2 },
        data: { reminderFlags: 3 },
      }),
    );
    expect(notify).toHaveBeenCalledOnce();
  });

  test("includes a marked legacy scalar invoice in billing reminders", async () => {
    const invoice = {
      id: "legacy-invoice-id",
      invoiceNumber: "INV-LEGACY",
      amount: 100,
      reminderFlags: 0,
      paymentPlanId: null,
      notes: "Down-payment invoice required to activate the contract",
      dueDate: new Date(),
      client: { userId: "client-user-id", companyName: "Company" },
      contract: {
        title: "Contract",
        totalValue: 1000,
        downPaymentType: "FIXED",
        downPaymentValue: 100,
      },
    };
    const findMany = vi.fn().mockResolvedValue([invoice]);
    const notify = vi.fn().mockResolvedValue(undefined);
    const service = new BillingCronService(
      {
        companySetting: {
          findUnique: vi.fn().mockResolvedValue({ value: [0] }),
        },
        invoice: {
          findMany,
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      } as any,
      { createLocalizedNotification: notify } as any,
      {} as any,
    );

    await (service as any).sendReminders();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({
          paymentPlanId: expect.anything(),
        }),
      }),
    );
    expect(notify).toHaveBeenCalledOnce();
  });

  test("auto-cancels marked legacy scalar invoices but ignores unrelated invoices", async () => {
    const fallbackInvoice = {
      id: "legacy-invoice-id",
      issueDate: new Date(0),
      paymentPlanId: null,
      notes: "Down-payment invoice required to activate the contract",
      amount: 100,
      contract: {
        id: "contract-id",
        status: "SIGNED",
        title: "Contract",
        createdBy: "creator-id",
        client: { userId: null, accountManager: null },
        totalValue: 1000,
        downPaymentType: "FIXED",
        downPaymentValue: 100,
      },
      paymentPlan: null,
    };
    const unrelatedInvoice = {
      ...fallbackInvoice,
      id: "unrelated-invoice-id",
      notes: "Unrelated invoice",
    };
    const contractUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const historyCreate = vi.fn();
    const findMany = vi
      .fn()
      .mockResolvedValue([fallbackInvoice, unrelatedInvoice]);
    const service = new BillingCronService(
      {
        companySetting: { findUnique: vi.fn().mockResolvedValue(null) },
        invoice: { findMany },
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback({
            contract: { updateMany: contractUpdateMany },
            invoice: { update: vi.fn() },
            contractStatusHistory: { create: historyCreate },
          }),
        ),
      } as any,
      { notifyUsersWithMessage: vi.fn().mockResolvedValue(undefined) } as any,
      {} as any,
    );

    await (service as any).cancelUnpaidDownPayments();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ paymentPlan: expect.anything() }),
      }),
    );
    expect(contractUpdateMany).toHaveBeenCalledOnce();
    expect(historyCreate).toHaveBeenCalledOnce();
  });

  test("falls back to safe reminder offsets when configuration would reserve escalation bit", async () => {
    const service = new BillingCronService(
      {
        companySetting: {
          findUnique: vi.fn().mockResolvedValue({
            value: [10, 9, 8, 7, 6, 5, 4, 3],
          }),
        },
      } as any,
      {} as any,
      {} as any,
    );

    await expect((service as any).getReminderOffsetDays()).resolves.toEqual([
      5, 3, 0,
    ]);
  });

  test("does not let the normal SEVEN_DAYS alert suppress renewal escalation", async () => {
    const notifications = vi.fn().mockResolvedValue(undefined);
    const prisma = {
      contract: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([
            {
              id: "contract-id",
              title: "Contract",
              createdBy: "creator-id",
              client: {
                accountManager: "manager-id",
                userId: null,
                companyName: "Company",
              },
            },
          ])
          .mockResolvedValueOnce([]),
      },
      contractRenewalAlert: {
        findFirst: vi.fn().mockImplementation(({ where }: any) => {
          if (where.alertType === "THIRTY_DAYS")
            return { id: "thirty-day-alert" };
          if (where.alertType === "SEVEN_DAYS")
            return { id: "normal-alert", isSent: true };
          return null;
        }),
        create: vi
          .fn()
          .mockResolvedValue({ id: "normal-alert", isSent: false }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      notificationEvent: { findFirst: vi.fn().mockResolvedValue(null) },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
        callback({
          $executeRaw: vi.fn(),
          contractRenewalAlert: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi
              .fn()
              .mockResolvedValue({ id: "normal-alert", isSent: false }),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          notificationEvent: {
            findMany: vi.fn().mockResolvedValue([]),
            create: vi.fn().mockResolvedValue({ id: "claim-event" }),
            update: vi.fn(),
          },
        }),
      ),
    };
    const service = new ContractCronService(
      prisma as any,
      { notifyUsersWithMessage: notifications } as any,
    );

    await service.handleExpiringContracts();

    expect(notifications).toHaveBeenCalledTimes(2);
    expect(notifications).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ eventType: "CONTRACT_EXPIRING" }),
    );
    expect(notifications).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ eventType: "RENEWAL_ESCALATED" }),
    );
  });

  test("commits renewal claims before notification and retries released claims", async () => {
    let inTransaction = false;
    let claimStatus: "RELEASED" | "CLAIMED" | "DELIVERED" = "RELEASED";
    let claimCreates = 0;
    let contractFindManyCalls = 0;
    const escalationNotifications = vi
      .fn()
      .mockRejectedValueOnce(new Error("notification unavailable"))
      .mockResolvedValueOnce(undefined);
    const notifications = vi.fn(async (params: any) => {
      expect(inTransaction).toBe(false);
      if (params.eventType === "RENEWAL_ESCALATED") {
        return escalationNotifications(params);
      }
      return undefined;
    });
    const prisma = {
      contract: {
        findMany: vi.fn().mockImplementation(() => {
          contractFindManyCalls += 1;
          return contractFindManyCalls % 2 === 1
            ? [
                {
                  id: "contract-id",
                  title: "Contract",
                  createdBy: "creator-id",
                  client: {
                    accountManager: "manager-id",
                    userId: null,
                    companyName: "Company",
                  },
                },
              ]
            : [];
        }),
      },
      contractRenewalAlert: {
        findFirst: vi
          .fn()
          .mockImplementation(({ where }: any) =>
            where.alertType === "THIRTY_DAYS"
              ? { id: "thirty-day-alert", isSent: true }
              : { id: "normal-alert", isSent: true },
          ),
        updateMany: vi.fn(),
      },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) => {
        inTransaction = true;
        const result = await callback({
          $executeRaw: vi.fn(),
          contractRenewalAlert: {
            findFirst: vi.fn().mockResolvedValue({
              id: "normal-alert",
              isSent: true,
              sentAt: new Date(),
            }),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            create: vi.fn().mockResolvedValue({ id: "escalation-alert" }),
          },
          notificationEvent: {
            findMany: vi
              .fn()
              .mockResolvedValue(
                claimStatus === "RELEASED"
                  ? []
                  : [{ metadata: { status: claimStatus } }],
              ),
            create: vi.fn().mockImplementation(() => {
              claimCreates += 1;
              claimStatus = "CLAIMED";
              return { id: `claim-${claimCreates}` };
            }),
            update: vi.fn().mockImplementation(({ data }: any) => {
              claimStatus = data.metadata.status;
              return { id: "claim-event" };
            }),
          },
        });
        inTransaction = false;
        return result;
      }),
    };
    const service = new ContractCronService(
      prisma as any,
      { notifyUsersWithMessage: notifications } as any,
    );

    await service.handleExpiringContracts();
    await service.handleExpiringContracts();
    await service.handleExpiringContracts();

    expect(escalationNotifications).toHaveBeenCalledTimes(2);
    expect(claimCreates).toBe(2);
    expect(claimStatus).toBe("DELIVERED");
  });

  test.each([
    ["fresh", { status: "CLAIMED", claimedAt: new Date().toISOString() }, 0],
    [
      "stale",
      {
        status: "CLAIMED",
        claimedAt: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
      },
      1,
    ],
    ["delivered", { status: "DELIVERED" }, 0],
  ] as const)(
    "handles %s renewal escalation claims without duplicate delivery",
    async (_name, existingMetadata, expectedUrgentNotifications) => {
      let transactionCalls = 0;
      const notifications = vi.fn().mockResolvedValue(undefined);
      const claimCreate = vi.fn().mockResolvedValue({ id: "new-claim" });
      const claimUpdate = vi.fn();
      const prisma = {
        contract: {
          findMany: vi
            .fn()
            .mockResolvedValueOnce([
              {
                id: "contract-id",
                title: "Contract",
                createdBy: "creator-id",
                client: {
                  accountManager: "manager-id",
                  userId: null,
                  companyName: "Company",
                },
              },
            ])
            .mockResolvedValueOnce([]),
        },
        contractRenewalAlert: {
          findFirst: vi
            .fn()
            .mockImplementation(({ where }: any) =>
              where.alertType === "THIRTY_DAYS"
                ? { id: "thirty-day-alert", isSent: true }
                : null,
            ),
          create: vi.fn().mockResolvedValue({
            id: "normal-alert",
            isSent: false,
          }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        $transaction: vi.fn(async (callback: (tx: any) => unknown) => {
          transactionCalls += 1;
          if (transactionCalls === 1) {
            return callback({
              contractRenewalAlert: {
                findFirst: vi.fn().mockResolvedValue(null),
                create: vi.fn().mockResolvedValue({
                  id: "normal-alert",
                  isSent: false,
                }),
                updateMany: vi.fn().mockResolvedValue({ count: 1 }),
              },
            });
          }
          if (transactionCalls === 2) {
            return callback({
              $executeRaw: vi.fn(),
              contractRenewalAlert: {
                create: vi.fn().mockResolvedValue({ id: "escalation-alert" }),
              },
              notificationEvent: {
                findMany: vi
                  .fn()
                  .mockResolvedValue([{ metadata: existingMetadata }]),
                create: claimCreate,
              },
            });
          }
          return callback({
            contractRenewalAlert: {
              updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            },
            notificationEvent: { update: claimUpdate },
          });
        }),
      };
      const service = new ContractCronService(
        prisma as any,
        { notifyUsersWithMessage: notifications } as any,
      );

      await service.handleExpiringContracts();

      expect(
        notifications.mock.calls.filter(
          ([params]) => params.eventType === "RENEWAL_ESCALATED",
        ),
      ).toHaveLength(expectedUrgentNotifications);
      if (expectedUrgentNotifications === 1) {
        expect(claimCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              metadata: expect.objectContaining({
                status: "CLAIMED",
                claimedAt: expect.any(String),
              }),
            }),
          }),
        );
      } else {
        expect(claimCreate).not.toHaveBeenCalled();
      }
    },
  );

  test("validates define against the locked current contract total", async () => {
    const service = createPaymentPlanService({
      $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
        callback({
          $queryRaw: vi.fn(),
          contract: {
            findUnique: vi.fn().mockResolvedValue({
              id: "contract-id",
              totalValue: 500,
              status: "SENT",
            }),
          },
          contractPaymentPlan: { updateMany: vi.fn(), createMany: vi.fn() },
        }),
      ),
    });

    await expect(
      service.definePlan("contract-id", {
        rows: [
          {
            label: "Down payment",
            sequence: 0,
            triggerType: "ON_SIGN",
            amountType: "FIXED",
            amountValue: 800,
          },
        ],
      } as any),
    ).rejects.toSatisfy((error: unknown) => {
      expectDomainError(
        error,
        400,
        "CONTRACT_PAYMENT_PLAN_DOWN_PAYMENT_EXCEEDS_TOTAL",
      );
      expect((error as any).getResponse().details).toMatchObject({
        value: 800,
        totalValue: 500,
      });
      return true;
    });
  });

  test("validates add and update against the locked current contract total", async () => {
    const createLockedService = (rowExists: boolean) =>
      createPaymentPlanService({
        contractPaymentPlan: {
          findFirst: vi.fn().mockResolvedValue(
            rowExists
              ? {
                  id: "row-id",
                  contractId: "contract-id",
                  sequence: 0,
                  isActive: true,
                  isRecurring: false,
                  dueOffsetDays: 0,
                }
              : null,
          ),
        },
        $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
          callback({
            $queryRaw: vi.fn(),
            contract: {
              findUnique: vi.fn().mockResolvedValue({
                id: "contract-id",
                totalValue: 500,
                status: "SENT",
              }),
            },
            contractPaymentPlan: {
              count: vi.fn().mockResolvedValue(0),
              findFirst: vi.fn().mockResolvedValue(
                rowExists
                  ? {
                      id: "row-id",
                      contractId: "contract-id",
                      sequence: 0,
                      isActive: true,
                      isRecurring: false,
                      dueOffsetDays: 0,
                    }
                  : null,
              ),
              aggregate: vi.fn().mockResolvedValue({ _max: { sequence: 0 } }),
              create: vi.fn(),
              updateMany: vi.fn().mockResolvedValue({ count: 1 }),
              findUnique: vi.fn().mockResolvedValue({ id: "row-id" }),
            },
          }),
        ),
      });
    const row = {
      label: "Down payment",
      sequence: 0,
      triggerType: "ON_SIGN",
      amountType: "FIXED",
      amountValue: 800,
    };

    for (const [service, action] of [
      [createLockedService(false), "addRow"],
      [createLockedService(true), "updateRow"],
    ] as const) {
      await expect(
        action === "addRow"
          ? service.addRow("contract-id", row as any)
          : service.updateRow("contract-id", "row-id", row as any),
      ).rejects.toSatisfy((error: unknown) => {
        expectDomainError(
          error,
          400,
          "CONTRACT_PAYMENT_PLAN_DOWN_PAYMENT_EXCEEDS_TOTAL",
        );
        return true;
      });
    }
  });

  test("locks and constrains active payment-plan row updates by contract", async () => {
    const queryRaw = vi.fn();
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const service = createPaymentPlanService({
      contractPaymentPlan: {
        findFirst: vi.fn().mockResolvedValue({
          id: "row-id",
          contractId: "contract-id",
          sequence: 0,
          isActive: true,
          isRecurring: false,
          dueOffsetDays: 0,
          contract: { totalValue: 1000 },
        }),
      },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
        callback({
          $queryRaw: queryRaw,
          contract: {
            findUnique: vi.fn().mockResolvedValue({
              id: "contract-id",
              totalValue: 1000,
              status: "SENT",
            }),
          },
          contractPaymentPlan: {
            count: vi.fn().mockResolvedValue(0),
            findFirst: vi
              .fn()
              .mockResolvedValueOnce({
                id: "row-id",
                contractId: "contract-id",
                sequence: 0,
                isActive: true,
                isRecurring: false,
                dueOffsetDays: 0,
              })
              .mockResolvedValue(null),
            aggregate: vi.fn().mockResolvedValue({ _max: { sequence: 0 } }),
            updateMany,
            findUnique: vi.fn().mockResolvedValue({ id: "row-id" }),
          },
        }),
      ),
    });

    await service.updateRow("contract-id", "row-id", {
      label: "Updated",
      sequence: 2,
      triggerType: "PERIOD_END",
      amountType: "FIXED",
      amountValue: 100,
    } as any);

    expect(queryRaw).toHaveBeenCalledOnce();
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "row-id", contractId: "contract-id", isActive: true },
      data: expect.objectContaining({ label: "Updated", sequence: 2 }),
    });
  });

  test("locks and constrains active payment-plan row removal by contract", async () => {
    const queryRaw = vi.fn();
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const service = createPaymentPlanService({
      contractPaymentPlan: {
        findFirst: vi.fn().mockResolvedValue({
          id: "row-id",
          contractId: "contract-id",
          isActive: true,
        }),
      },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
        callback({
          $queryRaw: queryRaw,
          contract: {
            findUnique: vi.fn().mockResolvedValue({
              id: "contract-id",
              totalValue: 1000,
              status: "SENT",
            }),
          },
          contractPaymentPlan: {
            findFirst: vi.fn().mockResolvedValue({
              id: "row-id",
              contractId: "contract-id",
              isActive: true,
            }),
            updateMany,
            findUnique: vi
              .fn()
              .mockResolvedValue({ id: "row-id", isActive: false }),
          },
        }),
      ),
    });

    await service.removeRow("contract-id", "row-id");

    expect(queryRaw).toHaveBeenCalledOnce();
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "row-id", contractId: "contract-id", isActive: true },
      data: { isActive: false },
    });
  });

  test("retries a failed SEVEN_DAYS notification and deduplicates a later success", async () => {
    const alert = {
      id: "alert-id",
      isSent: false,
      sentAt: null as Date | null,
    };
    const notifications = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary notification failure"))
      .mockResolvedValueOnce(undefined);
    let contractFindManyCalls = 0;
    const prisma = {
      contract: {
        findMany: vi.fn().mockImplementation(() => {
          contractFindManyCalls += 1;
          return contractFindManyCalls % 2 === 1
            ? [
                {
                  id: "contract-id",
                  title: "Contract",
                  createdBy: "creator-id",
                  client: {
                    accountManager: null,
                    userId: null,
                    companyName: "Company",
                  },
                },
              ]
            : [];
        }),
      },
      contractRenewalAlert: {
        findFirst: vi.fn().mockResolvedValue(null),
        updateMany: vi.fn().mockImplementation(({ data }: any) => {
          alert.isSent = data.isSent;
          alert.sentAt = data.sentAt ?? null;
          return { count: 1 };
        }),
      },
      notificationEvent: { findFirst: vi.fn().mockResolvedValue(null) },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) =>
        callback({
          $executeRaw: vi.fn(),
          contractRenewalAlert: {
            findFirst: vi.fn().mockResolvedValue(alert),
            updateMany: vi.fn().mockImplementation(({ data }: any) => {
              alert.isSent = data.isSent;
              alert.sentAt = data.sentAt ?? null;
              return { count: 1 };
            }),
          },
        }),
      ),
    };
    const service = new ContractCronService(
      prisma as any,
      { notifyUsersWithMessage: notifications } as any,
    );

    await service.handleExpiringContracts();
    await service.handleExpiringContracts();
    await service.handleExpiringContracts();

    expect(notifications).toHaveBeenCalledTimes(2);
    expect(alert.isSent).toBe(true);
  });
});
