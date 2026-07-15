import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
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
import type { Prisma } from "@prisma/client";

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

  private async createProjectFromSignedContract(
    contractId: string,
    initialStatus: ProjectStatus = ProjectStatus.PLANNING,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        client: {
          // Personal identity (name, email, phone) now lives on the
          // `User` table — we must include it here to use it below.
          // The old `contactName` field on Client was removed as part
          // of the unification migration.
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
          select: {
            id: true,
            companyName: true,
            accountManager: true,
            userId: true,
            // FK to the linked User; included above via `include: { user }`.
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
            lead: { select: { id: true } },
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
      throw new NotFoundException("Contract not found for project handover");
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
      throw new BadRequestException(
        "Cannot auto-create project without an active PM account",
      );
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
                title: tmpl.titleAr || tmpl.title,
                description: tmpl.descriptionAr || tmpl.description,
                filePath: "",
                status: TaskStatus.TODO,
                isVisibleToClient: true,
              },
            });
          }
        }
      } else if (contract.request?.lead?.id) {
        const leadServices = await tx.leadService.findMany({
          where: { leadId: contract.request.lead.id },
          include: {
            service: {
              include: { deliverableTemplates: true },
            },
          },
        });

        for (const leadService of leadServices) {
          for (const tmpl of leadService.service.deliverableTemplates) {
            await tx.deliverable.create({
              data: {
                projectId: createdProject.id,
                title: tmpl.titleAr || tmpl.title,
                description: tmpl.descriptionAr || tmpl.description,
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
      .createNotification({
        entityId: project.id,
        entityType: "project",
        eventType: "PROJECT_CREATED_FROM_CONTRACT",
        userId: projectManagerId,
        title: "تم إنشاء مشروع جديد تلقائياً",
        body: `تم إنشاء مشروع "${project.name}" بعد توقيع العقد. يمكنك الآن توزيع المهام على الفريق.`,
        metadata: {
          contractId: contract.id,
          clientId: contract.clientId,
          autoCreated: true,
        },
      })
      .catch(() => undefined);

    if (fallbackUsed) {
      this.notificationsService
        .broadcast({
          title: "تعيين مدير مشروع تلقائي",
          message: `تم إنشاء مشروع تلقائياً من العقد "${contract.title}" وتم تعيينه لـ "${assignment.pmName}" تلقائياً (أقل عبء مشاريع: ${assignment.currentLoad} مشاريع نشطة).`,
          roles: ["ADMIN", "SALES"],
        })
        .catch(() => undefined);
    } else if (assignment.isAccountManager) {
      this.notificationsService
        .broadcast({
          title: "تعيين مدير مشروع",
          message: `تم إنشاء مشروع من العقد "${contract.title}" وتم تعيينه لمدير حساب العميل "${assignment.pmName}" (${assignment.currentLoad} مشاريع نشطة).`,
          roles: ["ADMIN"],
        })
        .catch(() => undefined);
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
    const existingInvoice = onSignRow?.id
      ? await this.prisma.invoice.findFirst({
          where: { contractId, paymentPlanId: onSignRow.id },
          select: { id: true, status: true },
        })
      : null;

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
      label: "الدفعة المقدمة (Down Payment)",
      issueDate: now,
      dueDate: now, // due immediately
      userId,
      notes: "فاتورة الدفعة المقدمة لتفعيل العقد",
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
        client: { select: { accountManager: true } },
      },
    });
    if (!contract) throw new NotFoundException("Contract not found");
    if (contract.status === ContractStatus.ACTIVE) return contract;
    if (contract.status !== ContractStatus.SIGNED) {
      throw new BadRequestException(
        `Contract must be SIGNED to activate (current: ${contract.status})`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const c = await tx.contract.update({
        where: { id: contractId },
        data: { status: ContractStatus.ACTIVE },
      });
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

      return c;
    });

    const projectManager = await this.prisma.project.findFirst({
      where: { contractId },
      select: { projectManagerId: true },
    });

    await this.notificationsService.notifyUsers({
      userIds: [
        contract.createdBy,
        contract.client.accountManager,
        projectManager?.projectManagerId,
      ].filter(Boolean) as string[],
      title: "تم تفعيل العقد",
      message: `تم تفعيل العقد "${contract.title}" بعد استلام الدفعة المقدمة.`,
      entityId: contractId,
      entityType: "CONTRACT",
      eventType: "CONTRACT_ACTIVATED",
    });

    const clientUser = await this.prisma.client.findUnique({
      where: { id: contract.clientId },
      select: { userId: true },
    });
    if (clientUser?.userId) {
      this.notificationsService
        .createNotification({
          entityId: contractId,
          entityType: "contract",
          eventType: "CONTRACT_ACTIVATED",
          userId: clientUser.userId,
          title: "تم تفعيل العقد",
          body: `تم تفعيل العقد "${contract.title}". فريق العمل جاهز لبدء مشروعك.`,
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

    return updated;
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
    await this.resumeFromPeriodPayment(
      payload.invoiceId,
      payload.userId || "system",
    ).catch((err) => {
      this.logger.error(
        `Failed to resume after period invoice payment ${payload.invoiceId}: ${err?.message}`,
      );
    });
  }

  /** Resume a suspended project/period when an overdue period invoice is paid. */
  private async resumeFromPeriodPayment(invoiceId: string, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        triggeredSuspension: true,
        contractId: true,
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
          changedBy: userId,
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
            await tx.contract.update({
              where: { id: invoice.contractId },
              data: { status: "ACTIVE" },
            });
            await this.recordContractStatusHistory(
              tx,
              invoice.contractId,
              ContractStatus.ON_HOLD,
              ContractStatus.ACTIVE,
              userId,
              "Resumed after period invoice payment",
            );
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
        .notifyUsers({
          userIds: resumeRecipients,
          excludeUserIds: [userId],
          title: "تم استئناف الفترة",
          message: `تم استئناف الفترة رقم ${period.periodNumber} بعد سداد الفاتورة`,
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

  /** An invoice is the down-payment invoice if its linked plan row is `ON_SIGN`. */
  private async isDownPaymentInvoice(payload: {
    invoiceId: string;
    paymentPlanId?: string | null;
  }): Promise<boolean> {
    if (payload.paymentPlanId) {
      const row = await this.prisma.contractPaymentPlan.findUnique({
        where: { id: payload.paymentPlanId },
        select: { triggerType: true },
      });
      return row?.triggerType === PaymentPlanTriggerType.ON_SIGN;
    }
    return false;
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

  async updatePaymentPlanRow(rowId: string, row: PaymentPlanRowDto) {
    return this.paymentPlanService.updateRow(rowId, row);
  }

  async removePaymentPlanRow(rowId: string) {
    return this.paymentPlanService.removeRow(rowId);
  }

  async create(userId: string, filePath: string, dto: CreateContractDto) {
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
      if (proposal) {
        if (proposal.servicesList) {
          servicesList = proposal.servicesList;
        }
        if (!dto.totalValue) totalValue = proposal.totalPrice;
        if (proposal.durationDays) {
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + proposal.durationDays);
        }
      }
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

      // Auto-generate payment plan rows from scalar fields if no explicit plan provided.
      if (dto.paymentPlan && dto.paymentPlan.length > 0) {
        for (const [i, row] of dto.paymentPlan.entries()) {
          await tx.contractPaymentPlan.create({
            data: {
              contractId: contract.id,
              label: row.label,
              sequence: row.sequence ?? i,
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
            label: "الدفعة الأولى",
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
              label: "الدفعة الشهرية",
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
        .createNotification({
          entityId: shareLinkToken,
          entityType: "contract",
          eventType: "CONTRACT_SENT",
          userId: recipientId,
          title: "عقد جديد بانتظار توقيعك",
          body: `العقد "${created.contract.title}" جاهز لمراجعته وتوقيعه`,
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
        request: {
          include: {
            lead: { select: { id: true, pipelineStage: true } },
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
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
      throw new NotFoundException("العقد غير موجود أو انتهت صلاحية الرابط");
    }

    return contract;
  }

  /** Public: CLIENT signs the contract via share link token */
  async signByToken(token: string, dto: SignByTokenDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { shareLinkToken: token },
      include: {
        request: {
          include: {
            client: { select: { userId: true } },
            lead: { select: { id: true, pipelineStage: true } },
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException("العقد غير موجود");
    }

    if (contract.status !== ContractStatus.SENT) {
      throw new BadRequestException("لا يمكن توقيع هذا العقد في وضعه الحالي");
    }

    const signedResult = await this.prisma.$transaction(async (tx) => {
      const signed = await tx.contract.update({
        where: { id: contract.id },
        data: {
          status: ContractStatus.SIGNED,
          eSigned: true,
          signedAt: new Date(),
        },
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

      const clientUser = await this.prisma.client.findUnique({
        where: { id: contract.clientId },
        select: { userId: true },
      });

      this.notificationsService
        .createNotification({
          entityId: signed.id,
          entityType: "contract",
          eventType: "CONTRACT_SIGNED",
          userId: contract.createdBy,
          title: "تم توقيع العقد",
          body: `العميل وقّع على العقد "${contract.title}"`,
        })
        .catch(() => undefined);

      if (clientUser?.userId) {
        this.notificationsService
          .createNotification({
            entityId: signed.id,
            entityType: "contract",
            eventType: "CONTRACT_SIGNED",
            userId: clientUser.userId,
            title: "تم توقيع العقد بنجاح",
            body: `تم توقيع العقد "${contract.title}" بنجاح. سيتم بدء العمل على مشروعك قريباً.`,
          })
          .catch(() => undefined);
      }

      return { ...signed, signedByName: dto.signedByName };
    });

    await this.onContractSigned(contract.id, dto.signedByName).catch(() => {
      this.notificationsService
        .broadcast({
          title: "فشل إنشاء مشروع تلقائي",
          message: `تم توقيع العقد "${contract.title}" لكن تعذر إنشاء المشروع/فاتورة الدفعة المقدمة تلقائياً. يرجى مراجعة الحالة يدوياً.`,
          roles: ["ADMIN", "SALES"],
        })
        .catch(() => undefined);
    });

    this.clientCounterService
      .onContractSigned(contract.id)
      .catch(() => undefined);

    return signedResult;
  }

  async update(id: string, dto: UpdateContractDto) {
    return this.prisma.contract.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async send(id: string, userId?: string) {
    const contract = await this.findOne(id);

    const updated = await this.prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.SENT,
      },
    });

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
      await this.notificationsService.notifyUsers({
        userIds: notifyUserIds,
        title: "تم إرسال العقد",
        message: `أرسل ${actorName ?? "النظام"} العقد "${contract.title}" إلى ${contract.client.companyName}`,
        entityId: id,
        entityType: "CONTRACT",
        eventType: "CONTRACT_SENT",
      });
    }

    const clientUser = await this.prisma.client.findUnique({
      where: { id: contract.clientId },
      select: { userId: true },
    });
    if (clientUser?.userId) {
      this.notificationsService
        .createNotification({
          entityId: id,
          entityType: "contract",
          eventType: "CONTRACT_SENT",
          userId: clientUser.userId,
          title: "عقد جديد بانتظار توقيعك",
          body: `العقد "${contract.title}" جاهز لمراجعته وتوقيعه`,
        })
        .catch(() => undefined);
    }

    if (contract.requestId) {
      await this.requestsService.updateStatus(
        contract.requestId,
        RequestStatus.CONTRACT_SENT,
        contract.createdBy,
      );
    }

    return updated;
  }

  async sign(id: string, userId: string, dto: SignContractDto) {
    const contract = await this.findOne(id);

    if (contract.status !== ContractStatus.SENT) {
      throw new BadRequestException("لا يمكن توقيع هذا العقد في وضعه الحالي");
    }

    const signedResult = await this.prisma.$transaction(async (tx) => {
      const updatedContract = await tx.contract.update({
        where: { id },
        data: {
          status: ContractStatus.SIGNED,
          eSigned: true,
          signedAt: new Date(),
        },
      });

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
      this.notificationsService
        .broadcast({
          title: "فشل إنشاء مشروع تلقائي",
          message: `تم توقيع العقد "${contract.title}" لكن تعذر تهيئة المشروع/فاتورة الدفعة المقدمة تلقائياً.`,
          roles: ["ADMIN", "SALES"],
        })
        .catch(() => undefined);
    });

    this.clientCounterService.onContractSigned(id).catch(() => undefined);

    await this.notificationsService.notifyUsers({
      userIds: [contract.createdBy, contract.client.accountManager].filter(
        Boolean,
      ) as string[],
      excludeUserIds: [userId],
      title: "تم توقيع العقد",
      message: `تم توقيع العقد "${contract.title}" مع ${contract.client.companyName}`,
      entityId: id,
      entityType: "CONTRACT",
      eventType: "CONTRACT_SIGNED",
    });

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
    const actorId = userId || contract.createdBy;
    const fromStatus = contract.status as ContractStatus;
    const updated = await this.prisma.$transaction(async (tx) => {
      const c = await tx.contract.update({
        where: { id },
        data: { status: ContractStatus.CANCELLED },
      });
      await this.recordContractStatusHistory(
        tx,
        id,
        fromStatus,
        ContractStatus.CANCELLED,
        actorId,
        "Contract cancelled",
      );
      return c;
    });

    const cancelActor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { name: true },
    });
    const cancelActorName = cancelActor?.name ?? "النظام";

    await this.notificationsService.notifyUsers({
      userIds: [contract.createdBy, contract.client.accountManager].filter(
        Boolean,
      ) as string[],
      excludeUserIds: [actorId],
      title: "تم إلغاء العقد",
      message: `ألغى ${cancelActorName} العقد "${contract.title}" مع ${contract.client.companyName}`,
      entityId: id,
      entityType: "CONTRACT",
      eventType: "CONTRACT_CANCELLED",
    });

    const clientUser = await this.prisma.client.findUnique({
      where: { id: contract.clientId },
      select: { userId: true },
    });
    if (clientUser?.userId) {
      this.notificationsService
        .createNotification({
          entityId: id,
          entityType: "contract",
          eventType: "CONTRACT_CANCELLED",
          userId: clientUser.userId,
          title: "تم إلغاء العقد",
          body: `تم إلغاء العقد "${contract.title}". للاستفسار، يرجى التواصل مع فريقنا.`,
        })
        .catch(() => undefined);
    }

    if (contract.requestId) {
      await this.requestsService.updateStatus(
        contract.requestId,
        RequestStatus.CANCELLED,
        contract.createdBy,
      );
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
      const newVersionNumber = contract.versionNumber + 1;

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
}
