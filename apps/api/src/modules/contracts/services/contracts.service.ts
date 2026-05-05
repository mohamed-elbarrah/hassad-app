import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import {
  CreateContractDto,
  UpdateContractDto,
  SignContractDto,
  SignByTokenDto,
  CreateVersionDto,
} from "../dto/contract.dto";
import {
  ContractStatus,
  ProjectStatus,
  RequestStatus,
  TaskPriority,
  TaskStatus,
} from "@hassad/shared";
import { RequestsService } from "../../requests/requests.service";

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private requestsService: RequestsService,
  ) {}

  private async createProjectFromSignedContract(contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            accountManager: true,
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

    const preferredManagers =
      managerCandidates.length === 0
        ? []
        : await this.prisma.user.findMany({
            where: {
              id: { in: managerCandidates },
              isActive: true,
              role: { name: "PM" },
            },
            select: { id: true },
          });

    let projectManagerId =
      preferredManagers.find(
        (candidate) => candidate.id === contract.client.accountManager,
      )?.id ??
      preferredManagers.find((candidate) => candidate.id === contract.createdBy)
        ?.id;

    let fallbackUsed = false;

    if (!projectManagerId) {
      const fallbackPm = await this.prisma.user.findFirst({
        where: {
          isActive: true,
          role: { name: "PM" },
        },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!fallbackPm) {
        throw new BadRequestException(
          "Cannot auto-create project without an active PM account",
        );
      }

      fallbackUsed = true;
      projectManagerId = fallbackPm.id;
    }

    const projectName = contract.proposal
      ? `${contract.client.companyName} — ${contract.proposal.title}`
      : `${contract.client.companyName} — ${contract.title}`;
    const projectDescription = contract.proposal
      ? [
          `Auto-created from proposal: ${contract.proposal.title}`,
          `Services: ${typeof contract.proposal.servicesList === "string" ? contract.proposal.servicesList : JSON.stringify(contract.proposal.servicesList)}`,
          `Budget: ${contract.proposal.totalPrice} SAR`,
          `Duration: ${contract.proposal.durationDays} days`,
          `Client contact: ${contract.client.contactName}`,
        ].join("\n")
      : [
          `Auto-created after signing contract: ${contract.title}`,
          `Client contact: ${contract.client.contactName}`,
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
          status: ProjectStatus.PLANNING,
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
          title: "تعيين مدير مشروع احتياطي",
          message: `تم إنشاء مشروع تلقائياً من العقد "${contract.title}" وتم تعيين مدير مشروع احتياطي بسبب عدم توفر PM مرتبط بالعميل.`,
          roles: ["ADMIN", "SALES"],
        })
        .catch(() => undefined);
    }

    return project;
  }

  /**
   * One-step: create contract + immediately set SENT + generate shareLinkToken.
   * Notifies the CLIENT user linked to the originating request.
   */
  async create(userId: string, filePath: string, dto: CreateContractDto) {
    const shareLinkToken = randomUUID();

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
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          monthlyValue: dto.monthlyValue,
          totalValue: dto.totalValue,
          filePath,
          shareLinkToken,
        },
      });

      await this.requestsService.updateStatus(
        request.id,
        RequestStatus.CONTRACT_SENT,
        userId,
        undefined,
        tx,
      );

      return { contract, request };
    });

    const recipientId =
      created.request.client.userId ?? created.request.submittedBy;
    if (recipientId) {
      this.notificationsService
        .createNotification({
          entityId: shareLinkToken, // token so client can navigate directly to detail
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
        client: true,
        versions: true,
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
            contactName: true,
          },
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

      if (contract.requestId) {
        await this.requestsService.updateStatus(
          contract.requestId,
          RequestStatus.SIGNED,
          contract.createdBy,
          undefined,
          tx,
        );
      }

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

      return { ...signed, signedByName: dto.signedByName };
    });

    await this.createProjectFromSignedContract(contract.id).catch(() => {
      this.notificationsService
        .broadcast({
          title: "فشل إنشاء مشروع تلقائي",
          message: `تم توقيع العقد "${contract.title}" لكن تعذر إنشاء المشروع تلقائياً. يرجى مراجعة الحالة يدوياً.`,
          roles: ["ADMIN", "SALES"],
        })
        .catch(() => undefined);
    });

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

  async send(id: string) {
    const contract = await this.findOne(id);

    const updated = await this.prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.SENT,
      },
    });

    await this.notificationsService.notifyUsers({
      userIds: [contract.client.accountManager].filter(Boolean) as string[],
      title: "تم إرسال العقد",
      message: `تم إرسال العقد "${contract.title}" إلى ${contract.client.companyName}`,
      entityId: id,
      entityType: "CONTRACT",
      eventType: "CONTRACT_SENT",
    });

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

    await this.createProjectFromSignedContract(id).catch(() => {
      this.notificationsService
        .broadcast({
          title: "فشل إنشاء مشروع تلقائي",
          message: `تم توقيع العقد "${contract.title}" لكن تعذر إنشاء المشروع تلقائياً. يرجى مراجعة الحالة يدوياً.`,
          roles: ["ADMIN", "SALES"],
        })
        .catch(() => undefined);
    });

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

  async activate(id: string) {
    const contract = await this.findOne(id);
    const updated = await this.prisma.contract.update({
      where: { id },
      data: { status: ContractStatus.ACTIVE },
    });

    await this.notificationsService.notifyUsers({
      userIds: [contract.createdBy, contract.client.accountManager].filter(
        Boolean,
      ) as string[],
      title: "تم تفعيل العقد",
      message: `تم تفعيل العقد "${contract.title}" مع ${contract.client.companyName}`,
      entityId: id,
      entityType: "CONTRACT",
      eventType: "CONTRACT_ACTIVATED",
    });

    return updated;
  }

  async cancel(id: string) {
    const contract = await this.findOne(id);
    const updated = await this.prisma.contract.update({
      where: { id },
      data: { status: ContractStatus.CANCELLED },
    });

    await this.notificationsService.notifyUsers({
      userIds: [contract.createdBy, contract.client.accountManager].filter(
        Boolean,
      ) as string[],
      title: "تم إلغاء العقد",
      message: `تم إلغاء العقد "${contract.title}" مع ${contract.client.companyName}`,
      entityId: id,
      entityType: "CONTRACT",
      eventType: "CONTRACT_CANCELLED",
    });

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
          select: { id: true, companyName: true, contactName: true },
        },
        request: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createVersion(id: string, userId: string, dto: CreateVersionDto) {
    const contract = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const newVersionNumber = contract.versionNumber + 1;

      await tx.contractVersion.create({
        data: {
          contractId: id,
          versionNumber: newVersionNumber,
          filePath: dto.filePath,
          createdBy: userId,
        },
      });

      return tx.contract.update({
        where: { id },
        data: {
          versionNumber: newVersionNumber,
          filePath: dto.filePath,
        },
      });
    });
  }
}
