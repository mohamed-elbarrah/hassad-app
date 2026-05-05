import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  CreateLeadDto,
  UpdateLeadDto,
  AssignLeadDto,
  CreateContactLogDto,
  ChangeLeadStageDto,
  LeadServiceItemDto,
  AddLeadServiceDto,
  RemoveLeadServiceDto,
} from "../dto/lead.dto";
import { PipelineStage, ClientStatus, ProposalStatus } from "@hassad/shared";
import { CanonicalClientService } from "../../requests/canonical-client.service";
import { NotificationsService } from "../../notifications/services/notifications.service";

const USER_SUMMARY_SELECT = {
  id: true,
  name: true,
  email: true,
} as const;

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private readonly canonicalClientService: CanonicalClientService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateLeadDto) {
    const { services, ...leadData } = dto;

    const lead = await this.prisma.$transaction(async (tx) => {
      const newLead = await tx.lead.create({
        data: {
          ...leadData,
          pipelineStage: PipelineStage.NEW,
          createdBy: userId,
        },
      });

      if (services && services.length > 0) {
        await tx.leadService.createMany({
          data: services.map((s) => ({
            leadId: newLead.id,
            serviceId: s.serviceId,
            quantity: s.quantity ?? 1,
            notes: s.notes,
          })),
        });
      }

      return newLead;
    });

    const leadWithServices = await this.findOne(lead.id);

    this.notificationsService
      .broadcast({
        title: "عميل محتمل جديد",
        message: `طلب جديد من ${leadWithServices.contactName} — ${leadWithServices.companyName}`,
        roles: ["SALES"],
      })
      .catch(() => {});

    return leadWithServices;
  }

  async findAll() {
    return this.prisma.lead.findMany({
      where: { isActive: true },
      include: {
        assignee: { select: USER_SUMMARY_SELECT },
        services: { include: { service: true } },
      },
    });
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignee: { select: USER_SUMMARY_SELECT },
        pipelineHistory: true,
        contactLogs: true,
        services: {
          include: { service: { include: { deliverableTemplates: true } } },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    return lead;
  }

  async update(id: string, dto: UpdateLeadDto) {
    return this.prisma.lead.update({
      where: { id },
      data: dto,
    });
  }

  async addService(id: string, dto: AddLeadServiceDto) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException(`Lead with ID ${id} not found`);

    return this.prisma.leadService.upsert({
      where: { leadId_serviceId: { leadId: id, serviceId: dto.serviceId } },
      create: {
        leadId: id,
        serviceId: dto.serviceId,
        quantity: dto.quantity ?? 1,
        notes: dto.notes,
      },
      update: {
        quantity: dto.quantity ?? 1,
        notes: dto.notes,
      },
    });
  }

  async removeService(id: string, serviceId: string) {
    return this.prisma.leadService.delete({
      where: { leadId_serviceId: { leadId: id, serviceId } },
    });
  }

  async assign(id: string, dto: AssignLeadDto) {
    const lead = await this.findOne(id);

    const updated = await this.prisma.lead.update({
      where: { id },
      data: { assignedTo: dto.userId },
    });

    await this.notificationsService.notifyUsers({
      userIds: [dto.userId],
      title: "تم إسناد عميل محتمل إليك",
      message: `تم إسناد العميل المحتمل "${lead.companyName}" إليك`,
      entityId: id,
      entityType: "LEAD",
      eventType: "LEAD_ASSIGNED",
    });

    return updated;
  }

  async addContactLog(id: string, userId: string, dto: CreateContactLogDto) {
    return this.prisma.leadContactLog.create({
      data: {
        leadId: id,
        userId,
        ...dto,
      },
    });
  }

  async getContactLogs(id: string) {
    return this.prisma.leadContactLog.findMany({
      where: { leadId: id },
      include: { user: { select: USER_SUMMARY_SELECT } },
      orderBy: { contactedAt: "desc" },
    });
  }

  async changeStage(id: string, userId: string, dto: ChangeLeadStageDto) {
    const lead = await this.findOne(id);

    if (lead.pipelineStage === dto.toStage) {
      throw new BadRequestException("Lead is already in this stage");
    }

    // ── Stage gate: moving to APPROVED requires an APPROVED proposal ──────────
    if (dto.toStage === PipelineStage.APPROVED) {
      const approvedProposal = await this.prisma.proposal.findFirst({
        where: { leadId: id, status: ProposalStatus.APPROVED },
      });

      if (!approvedProposal) {
        throw new BadRequestException(
          "لا يمكن الانتقال إلى مرحلة الموافقة قبل اعتماد عرض فني من قِبَل العميل",
        );
      }
    }

    // Update Lead and Create History in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedLead = await tx.lead.update({
        where: { id },
        data: { pipelineStage: dto.toStage },
      });

      await tx.leadPipelineHistory.create({
        data: {
          leadId: id,
          fromStage: lead.pipelineStage,
          toStage: dto.toStage,
          changedBy: userId,
        },
      });

      return updatedLead;
    });

    const recipientIds = [lead.assignedTo, lead.createdBy].filter(
      Boolean,
    ) as string[];
    if (recipientIds.length > 0) {
      await this.notificationsService.notifyUsers({
        userIds: recipientIds,
        excludeUserIds: [userId],
        title: "تحديث مرحلة العميل المحتمل",
        message: `تم نقل "${lead.companyName}" من ${lead.pipelineStage} إلى ${dto.toStage}`,
        entityId: id,
        entityType: "LEAD",
        eventType: "LEAD_STAGE_CHANGED",
      });
    }

    return result;
  }

  async convertToClient(id: string, userId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: { request: true },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    if (lead.pipelineStage !== PipelineStage.CONTRACT_SIGNED) {
      throw new BadRequestException(
        "Lead must be in CONTRACT_SIGNED stage to convert",
      );
    }

    const client = await this.prisma.$transaction(async (tx) => {
      const { client, created } =
        await this.canonicalClientService.upsertCanonicalClient(tx, {
          leadId: lead.id,
          email: lead.email ?? null,
          companyName: lead.companyName,
          contactName: lead.contactName,
          phoneWhatsapp: lead.phoneWhatsapp,
          businessName: lead.businessName,
          businessType: lead.businessType,
          preferredManagerId: lead.assignedTo ?? null,
          status: ClientStatus.ACTIVE,
        });

      await tx.lead.update({
        where: { id },
        data: { isActive: false },
      });

      await tx.clientHistoryLog.create({
        data: {
          clientId: client.id,
          userId,
          eventType: created ? "CLIENT_CREATED" : "CLIENT_UPDATED",
          description: lead.requestId
            ? "Canonical client activated from signed request"
            : created
              ? "Client created from legacy lead conversion"
              : "Existing canonical client activated from legacy lead conversion",
        },
      });

      return client;
    });

    if (lead.assignedTo) {
      await this.notificationsService.createNotification({
        entityId: client.id,
        entityType: "lead",
        eventType: "LEAD_CONVERTED",
        userId: lead.assignedTo,
        title: "Lead Converted",
        body: `Lead "${lead.contactName}" has been successfully converted to a client`,
      });
    }

    return client;
  }
  async remove(id: string) {
    return this.prisma.lead.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
