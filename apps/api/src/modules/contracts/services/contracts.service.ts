import { Injectable, Logger } from "@nestjs/common";
import { OnEvent, EventEmitter2 } from "@nestjs/event-emitter";
import { randomUUID } from "crypto";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { FinanceService } from "../../finance/services/finance.service";
import {
  CreateContractDto,
  UpdateContractDto,
  SignContractDto,
  SignByTokenDto,
  CreateVersionDto,
} from "../dto/contract.dto";
import {
  DefinePaymentPlanDto,
  PaymentPlanRowDto,
} from "../dto/payment-plan.dto";
import {
  ClientStatus,
  ContractStatus,
  ProjectStatus,
  RequestStatus,
  TaskPriority,
  TaskStatus,
  PaymentPlanTriggerType,
  PaymentAmountType,
  ProjectPeriodStatus,
  InvoiceStatus,
} from "@hassad/shared";
import { RequestsService } from "../../requests/requests.service";
import { DirectConversationService } from "../../chat/services/direct-conversation.service";
import { PmAssignmentService } from "./pm-assignment.service";
import { ContractPaymentPlanService } from "./contract-payment-plan.service";
import { ClientCounterService } from "../../crm/services/client-counter.service";
import type { ContractStatus as ContractStatusEnum } from "@hassad/shared";
import { Prisma } from "@prisma/client";
import {
  contractHandoverNotFound,
  contractLinkExpired,
  contractNotFound,
  contractNotSignedForActivation,
  contractNotSignable,
  contractInvalidStatusTransition,
  contractPaymentPlanAmountInvalid,
  contractPaymentPlanDownPaymentRequired,
  contractCommercialTermsImmutable,
  contractTotalInvalid,
  contractRequestRequired,
  contractProposalRequired,
  contractPmRequired,
} from "../errors/contract-errors";

const DOWN_PAYMENT_INVOICE_NOTE =
  "Down-payment invoice required to activate the contract";

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private requestsService: RequestsService,
    private directConversationService: DirectConversationService,
    private pmAssignmentService: PmAssignmentService,
    private clientCounterService: ClientCounterService,
    private paymentPlanService: ContractPaymentPlanService,
    private financeService: FinanceService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ── Contract status history (RULE 2: history on every state change) ────────
  private async recordContractStatusHistory(
    tx: Prisma.TransactionClient,
    contractId: string,
    fromStatus: ContractStatusEnum,
    toStatus: ContractStatusEnum,
    changedBy: string,
    reason?: string,
  ) {
    return tx.contractStatusHistory.create({
      data: { contractId, fromStatus, toStatus, changedBy, reason },
    });
  }

  private async notifyRolesWithMessage(params: {
    roles: string[];
    messageKey: "contract.signed" | "project.created_from_contract";
    messageParams: Record<string, string | number | null | undefined>;
    entityId: string;
    entityType: string;
    eventType: string;
  }) {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: { in: params.roles } },
      },
      select: { id: true },
    });
    if (users.length === 0) return;

    return this.notificationsService.notifyUsersWithMessage({
      userIds: users.map((user) => user.id),
      messageKey: params.messageKey,
      messageParams: params.messageParams,
      entityId: params.entityId,
      entityType: params.entityType,
      eventType: params.eventType,
    });
  }

  private async createProjectFromSignedContract(
    contractId: string,
    initialStatus: ProjectStatus = ProjectStatus.PLANNING,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneWhatsapp: true,
              },
            },
          },
        },
        proposal: {
          select: {
            id: true,
            title: true,
            serviceDescription: true,
            servicesList: true,
            totalPrice: true,
            durationDays: true,
          },
        },
        request: {
          include: {
            services: {
              include: {
                service: {
                  include: { deliverableTemplates: true },
                },
              },
            },
          },
        },
      },
    });

    if (!contract) {
      throw contractHandoverNotFound();
    }

    const managerCandidates = [
      contract.client.accountManager,
      contract.createdBy,
    ].filter((value): value is string => !!value);

    const assignment = await this.pmAssignmentService.findBestPm(
      managerCandidates,
      contract.clientId,
    );

    if (!assignment) {
      throw contractPmRequired();
    }

    const projectManagerId = assignment.pmId;
    const fallbackUsed = assignment.isFallback;

    const projectName = contract.proposal
      ? `${contract.client.companyName} — ${contract.proposal.title}`
      : `${contract.client.companyName} — ${contract.title}`;
    const projectDescription = contract.proposal
      ? [
          `Auto-created from proposal: ${contract.proposal.title}`,
          `Services: ${typeof contract.proposal.servicesList === "string" ? contract.proposal.servicesList : JSON.stringify(contract.proposal.servicesList)}`,
          `Budget: ${contract.proposal.totalPrice} SAR`,
          `Duration: ${contract.proposal.durationDays} days`,
          `Client contact: ${contract.client.user?.name ?? "N/A"}`,
        ].join("\n")
      : [
          `Auto-created after signing contract: ${contract.title}`,
          `Client contact: ${contract.client.user?.name ?? "N/A"}`,
          "Next step: PM creates and assigns tasks from the project board.",
        ].join("\n");

    const project = await this.prisma.$transaction(async (tx) => {
      const existingProject = await tx.project.findFirst({
        where: { contractId },
        select: { id: true },
      });

      if (existingProject) {
        return null;
      }

      const createdProject = await tx.project.create({
        data: {
          requestId: contract.requestId ?? undefined,
          clientId: contract.clientId,
          contractId: contract.id,
          projectManagerId,
          name: projectName,
          description: projectDescription,
          status: initialStatus,
          priority: TaskPriority.NORMAL,
          startDate: contract.startDate,
          endDate: contract.endDate,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: createdProject.id,
          userId: projectManagerId,
          role: "MANAGER",
        },
      });

      const requestServices = contract.request?.services ?? [];

      if (requestServices.length > 0) {
        for (const requestService of requestServices) {
          for (const tmpl of requestService.service.deliverableTemplates) {
            await tx.deliverable.create({
              data: {
                projectId: createdProject.id,
                title: tmpl.title,
                description: tmpl.description,
                filePath: "",
                status: TaskStatus.TODO,
                isVisibleToClient: true,
              },
            });
          }
        }
      }

      if (contract.requestId) {
        await this.requestsService.updateStatus(
          contract.requestId,
          RequestStatus.PROJECT_CREATED,
          contract.createdBy,
          "Project auto-created from signed contract",
          tx,
        );
      }

      return createdProject;
    });

    if (!project) {
      return null;
    }

    await this.notificationsService
      .createLocalizedNotification({
        entityId: project.id,
        entityType: "project",
        eventType: "PROJECT_CREATED_FROM_CONTRACT",
        userId: projectManagerId,
        messageKey: "project.created_from_contract",
        messageParams: { projectName: project.name },
        metadata: {
          contractId: contract.id,
          clientId: contract.clientId,
          autoCreated: true,
        },
      })
      .catch(() => undefined);

    if (fallbackUsed) {
      this.notifyRolesWithMessage({
        roles: ["ADMIN", "SALES"],
        messageKey: "project.created_from_contract",
        messageParams: { projectName: project.name },
        entityId: project.id,
        entityType: "PROJECT",
        eventType: "PROJECT_CREATED_FROM_CONTRACT",
      }).catch(() => undefined);
    } else if (assignment.isAccountManager) {
      this.notifyRolesWithMessage({
        roles: ["ADMIN"],
        messageKey: "project.created_from_contract",
        messageParams: { projectName: project.name },
        entityId: project.id,
        entityType: "PROJECT",
        eventType: "PROJECT_CREATED_FROM_CONTRACT",
      }).catch(() => undefined);
    }

    this.directConversationService
      .getOrCreate(contract.client.userId, projectManagerId, undefined, {
        clientId: contract.clientId,
      })
      .catch(() => undefined);

    return project;
  }

  /**
   * One-step: create contract + immediately set SENT + generate shareLinkToken.
   * Notifies the CLIENT user linked to the originating request.
   */
  /**
   * Post-sign orchestration:
   *  - Create the delivery project.
   *  - If a down payment is required (> 0): create it as `PENDING_ACTIVATION` and
   *    issue the down-payment invoice; the contract stays `SIGNED` until that
   *    invoice is paid (the activation gate fires from the `invoice.paid` event).
   *  - If no down payment (0 / none): activate the contract immediately.
   */
  private async onContractSigned(contractId: string, signedByName?: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        title: true,
        totalValue: true,
        createdBy: true,
        downPaymentType: true,
        downPaymentValue: true,
      },
    });
    if (!contract) return;

    const onSignRow = await this.paymentPlanService.getOnSignRow(contractId);
    const downPaymentAmount = onSignRow
      ? this.paymentPlanService.resolveAmount(onSignRow, contract.totalValue)
      : this.resolveDownPaymentFallback(contract);

    if (downPaymentAmount <= 0) {
      // Zero down payment: create project ACTIVE and activate the contract now.
      await this.createProjectFromSignedContract(
        contractId,
        ProjectStatus.ACTIVE,
      ).catch((err) => {
        this.logger.error(
          `Failed to create project for contract ${contractId}: ${err?.message}`,
        );
      });
      await this.activateContract(
        contractId,
        contract.createdBy,
        "No down payment — activated on sign",
      );
      return;
    }

    // Down payment required: project waits for activation.
    await this.createProjectFromSignedContract(
      contractId,
      ProjectStatus.PENDING_ACTIVATION,
    ).catch((err) => {
      this.logger.error(
        `Failed to create project for contract ${contractId}: ${err?.message}`,
      );
    });

    // Check if a down-payment invoice was already created at contract creation.
    const existingInvoice = await this.findDownPaymentInvoice(
      contractId,
      onSignRow,
      downPaymentAmount,
    );

    if (existingInvoice && existingInvoice.status === InvoiceStatus.PAID) {
      // Already paid — activate immediately.
      await this.activateContract(
        contractId,
        contract.createdBy,
        "Down payment already paid — activated on sign",
      );
    } else if (!existingInvoice) {
      // No invoice yet (legacy contract created before this change) — create one now.
      await this.issueDownPaymentInvoice(
        contractId,
        contract.createdBy,
        onSignRow,
        downPaymentAmount,
      ).catch((err) => {
        this.logger.error(
          `Failed to issue down-payment invoice for contract ${contractId}: ${err?.message}`,
        );
      });
    }
    // If invoice exists and is PENDING, do nothing — client pays it, then handleInvoicePaid activates the contract.
  }

  /** Resolve down payment from the contract-level fallback fields when no plan row exists. */
  private resolveDownPaymentFallback(contract: {
    totalValue: number;
    downPaymentType?: "PERCENT" | "FIXED" | null;
    downPaymentValue?: number | null;
  }): number {
    if (!contract.downPaymentType || !contract.downPaymentValue) return 0;
    return this.paymentPlanService.resolveAmount(
      {
        amountType: contract.downPaymentType,
        amountValue: contract.downPaymentValue,
      },
      contract.totalValue,
    );
  }

  /** Issue the down-payment invoice from the ON_SIGN plan row (or fallback fields). */
  private async issueDownPaymentInvoice(
    contractId: string,
    userId: string,
    onSignRow: { id: string } | null,
    amount: number,
  ) {
    const now = new Date();
    return this.financeService.generateScheduledInvoice({
      contractId,
      paymentPlanId: onSignRow?.id,
      amount,
      label: "Down payment",
      issueDate: now,
      dueDate: now, // due immediately
      userId,
      notes: "Down-payment invoice required to activate the contract",
    });
  }

  /**
   * Activation gate: contract `SIGNED` → `ACTIVE` and project `PENDING_ACTIVATION`
   * → `ACTIVE`. Idempotent — safe to call when already active. Writes history.
   */
  async activateContract(contractId: string, userId: string, reason?: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        status: true,
        title: true,
        clientId: true,
        createdBy: true,
        totalValue: true,
        downPaymentType: true,
        downPaymentValue: true,
        client: { select: { accountManager: true } },
      },
    });
    if (!contract) throw contractNotFound();
    if (contract.status === ContractStatus.ACTIVE) return contract;
    if (contract.status !== ContractStatus.SIGNED) {
      throw contractNotSignedForActivation(contract.status);
    }

    const onSignRow = await this.paymentPlanService.getOnSignRow(contractId);
    const downPaymentAmount = onSignRow
      ? this.paymentPlanService.resolveAmount(onSignRow, contract.totalValue)
      : this.resolveDownPaymentFallback(contract);
    if (downPaymentAmount > 0) {
      const paidInvoice = await this.findDownPaymentInvoice(
        contractId,
        onSignRow,
        downPaymentAmount,
        InvoiceStatus.PAID,
      );
      if (!paidInvoice) {
        throw contractPaymentPlanDownPaymentRequired({
          contractId,
          paymentPlanId: onSignRow?.id ?? null,
        });
      }
    }

    const transition = await this.prisma.$transaction(async (tx) => {
      const result = await tx.contract.updateMany({
        where: { id: contractId, status: ContractStatus.SIGNED },
        data: { status: ContractStatus.ACTIVE },
      });
      if (result.count === 0) {
        const current = await tx.contract.findUnique({
          where: { id: contractId },
          select: { id: true, status: true },
        });
        if (current?.status === ContractStatus.ACTIVE) {
          return { contract: current, changed: false };
        }
        throw contractNotSignedForActivation(current?.status ?? "UNKNOWN");
      }
      await this.recordContractStatusHistory(
        tx,
        contractId,
        ContractStatus.SIGNED,
        ContractStatus.ACTIVE,
        userId,
        reason,
      );

      // Flip the project from PENDING_ACTIVATION → ACTIVE (if it exists and is waiting).
      await tx.project.updateMany({
        where: { contractId, status: ProjectStatus.PENDING_ACTIVATION },
        data: { status: ProjectStatus.ACTIVE },
      });

      // First signed contract → client becomes ACTIVE.
      await tx.client.update({
        where: { id: contract.clientId },
        data: { status: ClientStatus.ACTIVE },
      });

      const current = await tx.contract.findUnique({
        where: { id: contractId },
      });
      return { contract: current, changed: true };
    });

    if (!transition.changed) return transition.contract;

    const projectManager = await this.prisma.project.findFirst({
      where: { contractId },
      select: { projectManagerId: true },
    });

    await this.notificationsService
      .notifyUsersWithMessage({
        userIds: [
          contract.createdBy,
          contract.client.accountManager,
          projectManager?.projectManagerId,
        ].filter(Boolean) as string[],
        messageKey: "contract.activated",
        messageParams: { contractTitle: contract.title },
        entityId: contractId,
        entityType: "CONTRACT",
        eventType: "CONTRACT_ACTIVATED",
      })
      .catch(() => undefined);

    const clientUser = await this.prisma.client.findUnique({
      where: { id: contract.clientId },
      select: { userId: true },
    });
    if (clientUser?.userId) {
      this.notificationsService
        .createLocalizedNotification({
          entityId: contractId,
          entityType: "contract",
          eventType: "CONTRACT_ACTIVATED",
          userId: clientUser.userId,
          messageKey: "contract.activated",
          messageParams: { contractTitle: contract.title, client: "client" },
        })
        .catch(() => undefined);
    }

    // Notify other modules (e.g. ProjectPeriodsService generates periods for retainers).
    const project = await this.prisma.project.findFirst({
      where: { contractId },
      select: { id: true },
    });
    const contractWithType = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { type: true },
    });
    this.eventEmitter.emit("contract.activated", {
      contractId,
      projectId: project?.id ?? null,
      contractType: contractWithType?.type ?? null,
      userId,
    });

    return transition.contract;
  }

  /**
   * Domain event listener: when an invoice becomes fully paid.
   * - Down-payment (ON_SIGN) → activate contract (Phase 1).
   * - Period invoice (PERIOD_END) → resume suspended project/period (Phase 3).
   */
  @OnEvent("invoice.paid")
  async handleInvoicePaid(payload: {
    invoiceId: string;
    contractId?: string | null;
    paymentPlanId?: string | null;
    clientId?: string;
    amount?: number;
    userId?: string;
  }) {
    if (!payload.contractId) return;

    const isDownPayment = await this.isDownPaymentInvoice(payload);
    if (isDownPayment) {
      const contract = await this.prisma.contract.findUnique({
        where: { id: payload.contractId },
        select: { id: true, status: true, createdBy: true },
      });
      if (!contract || contract.status !== ContractStatus.SIGNED) return;

      await this.activateContract(
        contract.id,
        payload.userId || contract.createdBy,
        "Down payment received",
      ).catch((err) => {
        this.logger.error(
          `Failed to activate contract ${contract.id} after down-payment: ${err?.message}`,
        );
      });
      return;
    }

    // Phase 3: period invoice paid → resume suspended project/period.
    await this.resumeFromPeriodPayment(payload.invoiceId, payload.userId).catch(
      (err) => {
        this.logger.error(
          `Failed to resume after period invoice payment ${payload.invoiceId}: ${err?.message}`,
        );
      },
    );
  }

  /** Resume a suspended project/period when an overdue period invoice is paid. */
  private async resumeFromPeriodPayment(invoiceId: string, userId?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        triggeredSuspension: true,
        contractId: true,
        contract: { select: { createdBy: true } },
        period: {
          select: {
            id: true,
            periodNumber: true,
            status: true,
            endDate: true,
            projectId: true,
          },
        },
      },
    });
    if (!invoice || !invoice.period || !invoice.triggeredSuspension) return;
    const historyActorId = userId ?? invoice.contract?.createdBy;
    if (!historyActorId) return;

    const period = invoice.period;
    const projectStatus = await this.prisma.project.findUnique({
      where: { id: period.projectId },
      select: {
        id: true,
        status: true,
        projectManagerId: true,
        members: { select: { userId: true } },
        client: { select: { userId: true } },
      },
    });
    if (period.status !== ProjectPeriodStatus.SUSPENDED) return;

    const now = new Date();
    const targetStatus =
      period.endDate.getTime() <= now.getTime()
        ? ProjectPeriodStatus.CLOSED
        : ProjectPeriodStatus.ACTIVE;

    await this.prisma.$transaction(async (tx) => {
      await tx.projectPeriod.update({
        where: { id: period.id },
        data: { status: targetStatus, resumedAt: now, suspendedAt: null },
      });
      await tx.projectPeriodHistory.create({
        data: {
          periodId: period.id,
          fromStatus: ProjectPeriodStatus.SUSPENDED,
          toStatus: targetStatus,
          changedBy: historyActorId,
          reason: "Resumed after period invoice payment",
        },
      });

      if (projectStatus?.status === "ON_HOLD") {
        await tx.project.update({
          where: { id: period.projectId },
          data: { status: "ACTIVE" },
        });

        if (invoice.contractId) {
          const contract = await tx.contract.findUnique({
            where: { id: invoice.contractId },
            select: { status: true },
          });
          if (contract && contract.status === "ON_HOLD") {
            const resumed = await tx.contract.updateMany({
              where: { id: invoice.contractId, status: "ON_HOLD" },
              data: { status: "ACTIVE" },
            });
            if (resumed.count > 0) {
              await this.recordContractStatusHistory(
                tx,
                invoice.contractId,
                ContractStatus.ON_HOLD,
                ContractStatus.ACTIVE,
                historyActorId,
                "Resumed after period invoice payment",
              );
            }
          }
        }
      }
    });

    const resumeRecipients = [
      projectStatus?.projectManagerId,
      ...(projectStatus?.members ?? []).map((m) => m.userId),
      projectStatus?.client?.userId,
    ].filter(Boolean) as string[];

    if (resumeRecipients.length > 0) {
      await this.notificationsService
        .notifyUsersWithMessage({
          userIds: resumeRecipients,
          excludeUserIds: [userId],
          messageKey: "period.resumed",
          messageParams: { periodNumber: period.periodNumber },
          entityId: period.id,
          entityType: "PROJECT_PERIOD",
          eventType: "PERIOD_RESUMED",
        })
        .catch(() => undefined);
    }

    // Refresh the owning client's counters — resuming a project moves it
    // from ON_HOLD back to ACTIVE, which changes the `activeProjects` /
    // project-status breakdown on the KPI grid. Fire-and-forget to keep
    // the resume path snappy.
    if (projectStatus?.status === "ON_HOLD") {
      this.clientCounterService
        .onProjectStatusChange(period.projectId)
        .catch(() => undefined);
    }
  }

  private async findDownPaymentInvoice(
    contractId: string,
    onSignRow: { id: string } | null,
    amount: number,
    status?: InvoiceStatus,
  ) {
    return this.prisma.invoice.findFirst({
      where: {
        contractId,
        ...(onSignRow
          ? { paymentPlanId: onSignRow.id }
          : {
              paymentPlanId: null,
              amount,
              notes: DOWN_PAYMENT_INVOICE_NOTE,
            }),
        ...(status ? { status } : {}),
      },
      select: { id: true, status: true },
    });
  }

  /** An invoice is the down-payment invoice only when its exact contract linkage matches. */
  private async isDownPaymentInvoice(payload: {
    invoiceId: string;
    contractId?: string | null;
    paymentPlanId?: string | null;
  }): Promise<boolean> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: payload.invoiceId },
      select: {
        contractId: true,
        paymentPlanId: true,
        amount: true,
        notes: true,
        contract: {
          select: {
            totalValue: true,
            downPaymentType: true,
            downPaymentValue: true,
          },
        },
      },
    });
    if (!invoice || invoice.contractId !== payload.contractId) return false;

    if (payload.paymentPlanId) {
      const row = await this.prisma.contractPaymentPlan.findUnique({
        where: { id: payload.paymentPlanId },
        select: { triggerType: true, contractId: true },
      });
      return (
        invoice.paymentPlanId === payload.paymentPlanId &&
        row?.contractId === payload.contractId &&
        row.triggerType === PaymentPlanTriggerType.ON_SIGN
      );
    }

    const contract = invoice.contract;
    if (
      !contract ||
      invoice.paymentPlanId !== null ||
      invoice.notes !== DOWN_PAYMENT_INVOICE_NOTE ||
      !contract.downPaymentType ||
      contract.downPaymentValue == null
    ) {
      return false;
    }
    return (
      this.paymentPlanService.resolveAmount(
        {
          amountType: contract.downPaymentType,
          amountValue: contract.downPaymentValue,
        },
        contract.totalValue,
      ) === invoice.amount
    );
  }

  // ── Payment plan delegation (Sales defines the commercial plan) ──────────────
  async getPaymentPlan(contractId: string) {
    return this.paymentPlanService.getPlan(contractId);
  }

  async definePaymentPlan(contractId: string, dto: DefinePaymentPlanDto) {
    return this.paymentPlanService.definePlan(contractId, dto);
  }

  async addPaymentPlanRow(contractId: string, row: PaymentPlanRowDto) {
    return this.paymentPlanService.addRow(contractId, row);
  }

  async updatePaymentPlanRow(
    contractId: string,
    rowId: string,
    row: PaymentPlanRowDto,
  ) {
    return this.paymentPlanService.updateRow(contractId, rowId, row);
  }

  async removePaymentPlanRow(contractId: string, rowId: string) {
    return this.paymentPlanService.removeRow(contractId, rowId);
  }

  private async validateScalarDownPayment(
    dto: CreateContractDto,
    totalValue: number,
  ) {
    const hasType = dto.downPaymentType !== undefined;
    const hasValue = dto.downPaymentValue !== undefined;
    if (!hasType && !hasValue) return;

    if (!hasType || !hasValue) {
      throw contractPaymentPlanAmountInvalid({
        field: hasType ? "downPaymentValue" : "downPaymentType",
        required: true,
      });
    }

    await this.paymentPlanService.validateRows(
      [
        {
          label: "Down payment",
          sequence: 0,
          triggerType: PaymentPlanTriggerType.ON_SIGN,
          amountType: dto.downPaymentType!,
          amountValue: dto.downPaymentValue!,
          isRecurring: false,
          dueOffsetDays: 0,
        },
      ],
      totalValue,
    );
  }

  private validateTotalValue(totalValue: number) {
    if (!Number.isFinite(totalValue) || totalValue < 0) {
      throw contractTotalInvalid({
        field: "totalValue",
        value: totalValue,
        minimum: 0,
      });
    }
  }

  private async assertCommercialTermsMutable(
    tx: any,
    contract: { id: string; status: string },
  ) {
    if (
      contract.status &&
      contract.status !== ContractStatus.DRAFT &&
      contract.status !== ContractStatus.SENT
    ) {
      throw contractCommercialTermsImmutable({
        contractId: contract.id,
        currentStatus: contract.status,
      });
    }

    const invoice = tx.invoice?.findFirst
      ? await tx.invoice.findFirst({
          where: { contractId: contract.id },
          select: { id: true },
        })
      : null;
    if (invoice) {
      throw contractCommercialTermsImmutable({
        contractId: contract.id,
        invoiceId: invoice.id,
      });
    }
  }

  async create(userId: string, filePath: string, dto: CreateContractDto) {
    if (!dto.requestId) {
      throw contractRequestRequired({ field: "requestId" });
    }

    const shareLinkToken = randomUUID();

    let servicesList: any = undefined;
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    let endDate = dto.endDate ? new Date(dto.endDate) : new Date();
    const monthlyValue = dto.monthlyValue ?? 0;
    let totalValue = dto.totalValue ?? 0;

    if (dto.proposalId) {
      const proposal = await this.prisma.proposal.findUnique({
        where: { id: dto.proposalId },
        select: {
          servicesList: true,
          totalPrice: true,
          startDate: true,
          durationDays: true,
          title: true,
        },
      });
      if (!proposal) {
        throw contractProposalRequired({ field: "proposalId" });
      }
      if (proposal.servicesList) {
        servicesList = proposal.servicesList;
      }
      if (!dto.totalValue) totalValue = proposal.totalPrice;
      if (proposal.durationDays) {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + proposal.durationDays);
      }
    }

    this.validateTotalValue(totalValue);
    await this.validateScalarDownPayment(dto, totalValue);
    const paymentPlanRows = dto.paymentPlan?.length
      ? this.paymentPlanService.normalizeSequences(dto.paymentPlan)
      : undefined;
    if (paymentPlanRows) {
      await this.paymentPlanService.validateRows(paymentPlanRows, totalValue);
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const request = await this.requestsService.resolveRequestContext(
        {
          requestId: dto.requestId,
          proposalId: dto.proposalId,
        },
        userId,
        tx,
      );

      const contract = await tx.contract.create({
        data: {
          requestId: request.id,
          clientId: request.clientId,
          proposalId: dto.proposalId,
          createdBy: userId,
          title: dto.title,
          type: dto.type,
          status: ContractStatus.SENT,
          startDate,
          endDate,
          monthlyValue,
          totalValue,
          filePath,
          shareLinkToken,
          servicesList,
          downPaymentType: dto.downPaymentType,
          downPaymentValue: dto.downPaymentValue,
          numberOfMonths: dto.numberOfMonths,
        },
      });

      await this.recordContractStatusHistory(
        tx,
        contract.id,
        ContractStatus.DRAFT,
        ContractStatus.SENT,
        userId,
        "Contract created",
      );

      // Auto-generate payment plan rows from scalar fields if no explicit plan provided.
      if (paymentPlanRows) {
        for (const row of paymentPlanRows) {
          await tx.contractPaymentPlan.create({
            data: {
              contractId: contract.id,
              label: row.label,
              sequence: row.sequence!,
              triggerType: row.triggerType,
              amountType: row.amountType,
              amountValue: row.amountValue,
              isRecurring: row.isRecurring ?? false,
              dueOffsetDays: row.dueOffsetDays ?? 0,
            },
          });
        }
      } else if (
        dto.type === "MONTHLY_RETAINER" &&
        dto.downPaymentType &&
        dto.downPaymentValue != null
      ) {
        // Down payment row
        const downPaymentAmount =
          dto.downPaymentType === "PERCENT"
            ? Math.round(totalValue * (dto.downPaymentValue / 100) * 100) / 100
            : dto.downPaymentValue;

        await tx.contractPaymentPlan.create({
          data: {
            contractId: contract.id,
            label: "First payment",
            sequence: 0,
            triggerType: "ON_SIGN",
            amountType: dto.downPaymentType,
            amountValue: dto.downPaymentValue,
            isRecurring: false,
            dueOffsetDays: 0,
          },
        });

        // Recurring monthly row — derive amount from remaining / months
        const remaining = totalValue - downPaymentAmount;
        const months = dto.numberOfMonths ?? 1;
        const recurringAmount =
          dto.monthlyValue && dto.monthlyValue > 0
            ? dto.monthlyValue
            : months > 0
              ? Math.round((remaining / months) * 100) / 100
              : 0;

        if (recurringAmount > 0) {
          await tx.contractPaymentPlan.create({
            data: {
              contractId: contract.id,
              label: "Monthly payment",
              sequence: 1,
              triggerType: "PERIOD_END",
              amountType: "FIXED",
              amountValue: recurringAmount,
              isRecurring: true,
              dueOffsetDays: 0,
            },
          });
        }
      }

      await this.requestsService.updateStatus(
        request.id,
        RequestStatus.CONTRACT_SENT,
        userId,
        undefined,
        tx,
      );

      return { contract, request };
    });

    // Create down-payment invoice so the client sees it immediately.
    const onSignRow = await this.paymentPlanService.getOnSignRow(
      created.contract.id,
    );
    if (onSignRow) {
      const downPaymentAmount = this.paymentPlanService.resolveAmount(
        onSignRow,
        created.contract.totalValue,
      );
      if (downPaymentAmount > 0) {
        await this.issueDownPaymentInvoice(
          created.contract.id,
          userId,
          onSignRow,
          downPaymentAmount,
        ).catch((err) => {
          this.logger.error(
            `Failed to create down-payment invoice for contract ${created.contract.id}: ${err?.message}`,
          );
        });
      }
    }

    const recipientId =
      created.request.client.userId ?? created.request.submittedBy;
    if (recipientId) {
      this.notificationsService
        .createLocalizedNotification({
          entityId: shareLinkToken,
          entityType: "contract",
          eventType: "CONTRACT_SENT",
          userId: recipientId,
          messageKey: "contract.sent",
          messageParams: {
            contractTitle: created.contract.title,
            client: "client",
          },
        })
        .catch(() => undefined);
    }

    return { ...created.contract, shareLinkToken };
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        client: {
          // Personal identity (name, email, phone) now lives on `User`.
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneWhatsapp: true,
              },
            },
          },
        },
        versions: true,
        proposal: true,
        invoices: {
          include: { items: true, payments: true },
        },
        request: true,
      },
    });

    if (!contract) {
      throw contractNotFound({ contractId: id });
    }

    return contract;
  }

  /** Public: find contract by share link token (for client-facing page) */
  async findByToken(token: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { shareLinkToken: token },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            user: { select: { name: true, email: true, phoneWhatsapp: true } },
          },
        },
        proposal: true,
        invoices: {
          include: { items: true, payments: true },
        },
        request: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!contract) {
      throw contractLinkExpired();
    }

    return contract;
  }

  /** Public: CLIENT signs the contract via share link token */
  async signByToken(token: string, dto: SignByTokenDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { shareLinkToken: token },
      include: {
        request: {
          include: { client: { select: { userId: true } } },
        },
      },
    });

    if (!contract) {
      throw contractLinkExpired();
    }

    if (contract.status !== ContractStatus.SENT) {
      throw contractNotSignable();
    }

    const signedResult = await this.prisma.$transaction(async (tx) => {
      const result = await tx.contract.updateMany({
        where: { id: contract.id, status: ContractStatus.SENT },
        data: {
          status: ContractStatus.SIGNED,
          eSigned: true,
          signedAt: new Date(),
        },
      });
      if (result.count === 0) throw contractNotSignable();
      const signed = await tx.contract.findUnique({
        where: { id: contract.id },
      });

      await this.recordContractStatusHistory(
        tx,
        contract.id,
        ContractStatus.SENT,
        ContractStatus.SIGNED,
        contract.createdBy,
        dto.signedByName
          ? "Signed by " + dto.signedByName + " via share link"
          : "Signed via share link",
      );

      if (contract.requestId) {
        await this.requestsService.updateStatus(
          contract.requestId,
          RequestStatus.SIGNED,
          contract.createdBy,
          undefined,
          tx,
        );
      }

      return { ...signed, signedByName: dto.signedByName };
    });

    const clientUser = await this.prisma.client.findUnique({
      where: { id: contract.clientId },
      select: { userId: true },
    });

    await this.notificationsService
      .createLocalizedNotification({
        entityId: signedResult.id,
        entityType: "contract",
        eventType: "CONTRACT_SIGNED",
        userId: contract.createdBy,
        messageKey: "contract.signed",
        messageParams: { contractTitle: contract.title },
      })
      .catch(() => undefined);

    if (clientUser?.userId) {
      await this.notificationsService
        .createLocalizedNotification({
          entityId: signedResult.id,
          entityType: "contract",
          eventType: "CONTRACT_SIGNED",
          userId: clientUser.userId,
          messageKey: "contract.signed",
          messageParams: { contractTitle: contract.title, client: "client" },
        })
        .catch(() => undefined);
    }

    await this.onContractSigned(contract.id, dto.signedByName).catch(() => {
      this.notifyRolesWithMessage({
        roles: ["ADMIN", "SALES"],
        messageKey: "contract.signed",
        messageParams: { contractTitle: contract.title },
        entityId: contract.id,
        entityType: "CONTRACT",
        eventType: "CONTRACT_SIGNED",
      }).catch(() => undefined);
    });

    this.clientCounterService
      .onContractSigned(contract.id)
      .catch(() => undefined);

    return signedResult;
  }

  async update(id: string, dto: UpdateContractDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.lockContract(tx, id);
        const current = await tx.contract.findUnique({
          where: { id },
          select: {
            id: true,
            status: true,
            totalValue: true,
            downPaymentType: true,
            downPaymentValue: true,
          },
        });
        if (!current) throw contractNotFound();

        if (dto.totalValue !== undefined) {
          this.validateTotalValue(dto.totalValue);
          await this.assertCommercialTermsMutable(tx, current);
          const activeRows = await tx.contractPaymentPlan.findMany({
            where: { contractId: id, isActive: true },
          });
          await this.paymentPlanService.validateRows(
            activeRows as PaymentPlanRowDto[],
            dto.totalValue,
          );
          if (
            activeRows.length === 0 &&
            current.downPaymentType &&
            current.downPaymentValue != null
          ) {
            await this.paymentPlanService.validateRows(
              [
                {
                  label: "Down payment",
                  sequence: 0,
                  triggerType: PaymentPlanTriggerType.ON_SIGN,
                  amountType: current.downPaymentType as PaymentAmountType,
                  amountValue: current.downPaymentValue,
                  isRecurring: false,
                  dueOffsetDays: 0,
                },
              ],
              dto.totalValue,
            );
          }
        }

        return tx.contract.update({
          where: { id },
          data: {
            ...dto,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          },
        });
      });
    } catch (error) {
      if ((error as { code?: string }).code === "P2025") {
        throw contractNotFound();
      }
      throw error;
    }
  }

  async send(id: string, userId?: string) {
    const contract = await this.findOne(id);
    if (contract.status !== ContractStatus.DRAFT) {
      throw contractInvalidStatusTransition({
        action: "send",
        currentStatus: contract.status,
        allowedStatuses: [ContractStatus.DRAFT],
      });
    }

    const actorId = userId ?? contract.createdBy;
    const transition = await this.prisma.$transaction(async (tx) => {
      const result = await tx.contract.updateMany({
        where: { id, status: ContractStatus.DRAFT },
        data: { status: ContractStatus.SENT },
      });
      if (result.count === 0) {
        throw contractInvalidStatusTransition({
          action: "send",
          currentStatus: contract.status,
          allowedStatuses: [ContractStatus.DRAFT],
        });
      }
      await this.recordContractStatusHistory(
        tx,
        id,
        ContractStatus.DRAFT,
        ContractStatus.SENT,
        actorId,
        "Contract sent",
      );
      if (contract.requestId) {
        await this.requestsService.updateStatus(
          contract.requestId,
          RequestStatus.CONTRACT_SENT,
          actorId,
          undefined,
          tx,
        );
      }
      const sent = await tx.contract.findUnique({ where: { id } });
      return sent;
    });
    const updated = transition;

    let actorName: string | undefined;
    if (userId) {
      const actor = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      actorName = actor?.name;
    }

    const notifyUserIds = [
      contract.client.accountManager,
      contract.createdBy,
    ].filter(Boolean) as string[];
    if (notifyUserIds.length > 0) {
      await this.notificationsService
        .notifyUsersWithMessage({
          userIds: notifyUserIds,
          messageKey: "contract.sent",
          messageParams: {
            actorName: actorName ?? "System",
            contractTitle: contract.title,
            companyName: contract.client.companyName,
          },
          entityId: id,
          entityType: "CONTRACT",
          eventType: "CONTRACT_SENT",
        })
        .catch(() => undefined);
    }

    const clientUser = await this.prisma.client.findUnique({
      where: { id: contract.clientId },
      select: { userId: true },
    });
    if (clientUser?.userId) {
      this.notificationsService
        .createLocalizedNotification({
          entityId: id,
          entityType: "contract",
          eventType: "CONTRACT_SENT",
          userId: clientUser.userId,
          messageKey: "contract.sent",
          messageParams: { contractTitle: contract.title, client: "client" },
        })
        .catch(() => undefined);
    }

    return updated;
  }

  async sign(id: string, userId: string, dto: SignContractDto) {
    const contract = await this.findOne(id);

    if (contract.status !== ContractStatus.SENT) {
      throw contractNotSignable();
    }

    const signedResult = await this.prisma.$transaction(async (tx) => {
      const result = await tx.contract.updateMany({
        where: { id, status: ContractStatus.SENT },
        data: {
          status: ContractStatus.SIGNED,
          eSigned: true,
          signedAt: new Date(),
        },
      });
      if (result.count === 0) throw contractNotSignable();
      const updatedContract = await tx.contract.findUnique({ where: { id } });

      await this.recordContractStatusHistory(
        tx,
        id,
        ContractStatus.SENT,
        ContractStatus.SIGNED,
        userId,
        dto.signedByName ? "Signed by " + dto.signedByName : "Signed by staff",
      );

      if (contract.requestId) {
        await this.requestsService.updateStatus(
          contract.requestId,
          RequestStatus.SIGNED,
          userId,
          undefined,
          tx,
        );
      }

      return { ...updatedContract, signedByName: dto.signedByName };
    });

    await this.onContractSigned(id, dto.signedByName).catch(() => {
      this.notifyRolesWithMessage({
        roles: ["ADMIN", "SALES"],
        messageKey: "contract.signed",
        messageParams: { contractTitle: contract.title },
        entityId: id,
        entityType: "CONTRACT",
        eventType: "CONTRACT_SIGNED",
      }).catch(() => undefined);
    });

    this.clientCounterService.onContractSigned(id).catch(() => undefined);

    await this.notificationsService
      .notifyUsersWithMessage({
        userIds: [contract.createdBy, contract.client.accountManager].filter(
          Boolean,
        ) as string[],
        excludeUserIds: [userId],
        messageKey: "contract.signed",
        messageParams: {
          contractTitle: contract.title,
          companyName: contract.client.companyName,
        },
        entityId: id,
        entityType: "CONTRACT",
        eventType: "CONTRACT_SIGNED",
      })
      .catch(() => undefined);

    return signedResult;
  }

  /** Manual/admin activation endpoint — delegates to the activation gate. */
  async activate(id: string, userId?: string) {
    const contract = await this.findOne(id);
    const actorId = userId || contract.createdBy;
    return this.activateContract(id, actorId, "Manually activated");
  }

  async cancel(id: string, userId?: string) {
    const contract = await this.findOne(id);
    const cancellableStatuses = [
      ContractStatus.DRAFT,
      ContractStatus.SENT,
      ContractStatus.SIGNED,
      ContractStatus.ACTIVE,
      ContractStatus.ON_HOLD,
    ];
    if (!cancellableStatuses.includes(contract.status as ContractStatus)) {
      throw contractInvalidStatusTransition({
        action: "cancel",
        currentStatus: contract.status,
        allowedStatuses: cancellableStatuses,
      });
    }
    const actorId = userId || contract.createdBy;
    const fromStatus = contract.status as ContractStatus;
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.contract.updateMany({
        where: { id, status: fromStatus },
        data: { status: ContractStatus.CANCELLED },
      });
      if (result.count === 0) {
        throw contractInvalidStatusTransition({
          action: "cancel",
          currentStatus: contract.status,
          allowedStatuses: cancellableStatuses,
        });
      }
      await this.recordContractStatusHistory(
        tx,
        id,
        fromStatus,
        ContractStatus.CANCELLED,
        actorId,
        "Contract cancelled",
      );
      if (contract.requestId) {
        await this.requestsService.updateStatus(
          contract.requestId,
          RequestStatus.CANCELLED,
          actorId,
          undefined,
          tx,
        );
      }
      return tx.contract.findUnique({ where: { id } });
    });

    const cancelActor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { name: true },
    });
    const cancelActorName = cancelActor?.name ?? "System";

    await this.notificationsService
      .notifyUsersWithMessage({
        userIds: [contract.createdBy, contract.client.accountManager].filter(
          Boolean,
        ) as string[],
        excludeUserIds: [actorId],
        messageKey: "contract.canceled",
        messageParams: {
          actorName: cancelActorName,
          contractTitle: contract.title,
          companyName: contract.client.companyName,
        },
        entityId: id,
        entityType: "CONTRACT",
        eventType: "CONTRACT_CANCELLED",
      })
      .catch(() => undefined);

    const clientUser = await this.prisma.client.findUnique({
      where: { id: contract.clientId },
      select: { userId: true },
    });
    if (clientUser?.userId) {
      this.notificationsService
        .createLocalizedNotification({
          entityId: id,
          entityType: "contract",
          eventType: "CONTRACT_CANCELLED",
          userId: clientUser.userId,
          messageKey: "contract.canceled",
          messageParams: { contractTitle: contract.title, client: "client" },
        })
        .catch(() => undefined);
    }

    return updated;
  }

  async findAll(filters: {
    status?: string;
    clientId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.search)
      where.title = { contains: filters.search, mode: "insensitive" };
    const [items, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        include: { client: { select: { id: true, companyName: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contract.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * CLIENT portal: return all contracts linked to leads where createdBy = userId.
   */
  async getMyContracts(userId: string) {
    return this.prisma.contract.findMany({
      where: {
        OR: [{ request: { submittedBy: userId } }, { client: { userId } }],
      },
      include: {
        client: {
          select: { id: true, companyName: true },
        },
        request: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createVersion(
    id: string,
    userId: string,
    storageKey: string,
    dto: CreateVersionDto,
  ) {
    const contract = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await this.lockContract(tx, id);
      const lockedContract = await tx.contract.findUnique({
        where: { id },
        select: { versionNumber: true },
      });
      if (!lockedContract) throw contractNotFound();
      const newVersionNumber = lockedContract.versionNumber + 1;

      await tx.contractVersion.create({
        data: {
          contractId: id,
          versionNumber: newVersionNumber,
          filePath: storageKey,
          createdBy: userId,
        },
      });

      return tx.contract.update({
        where: { id },
        data: {
          versionNumber: newVersionNumber,
          filePath: storageKey,
        },
      });
    });
  }

  private async lockContract(tx: any, contractId: string) {
    if (typeof tx.$queryRaw !== "function") return;
    await tx.$queryRaw(
      Prisma.sql`SELECT id FROM contracts WHERE id = ${contractId} FOR UPDATE`,
    );
  }
}
