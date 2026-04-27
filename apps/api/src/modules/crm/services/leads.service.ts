import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadDto, AssignLeadDto, CreateContactLogDto, ChangeLeadStageDto } from '../dto/lead.dto';
import { PipelineStage, ClientStatus } from '@hassad/shared';
import { NotificationsService } from '../../notifications/services/notifications.service';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        ...dto,
        pipelineStage: PipelineStage.NEW,
      },
    });
  }

  async findAll() {
    return this.prisma.lead.findMany({
      where: { isActive: true },
      include: {
        assignee: true,
      },
    });
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignee: true,
        pipelineHistory: true,
        contactLogs: true,
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

  async assign(id: string, dto: AssignLeadDto) {
    return this.prisma.lead.update({
      where: { id },
      data: { assignedTo: dto.userId },
    });
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
      include: { user: true },
      orderBy: { contactedAt: 'desc' },
    });
  }

  async changeStage(id: string, userId: string, dto: ChangeLeadStageDto) {
    const lead = await this.findOne(id);

    if (lead.pipelineStage === dto.toStage) {
      throw new BadRequestException('Lead is already in this stage');
    }

    // Update Lead and Create History in a transaction
    return this.prisma.$transaction(async (tx) => {
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

      // TODO: Emit notification event

      return updatedLead;
    });
  }

  async convertToClient(id: string, userId: string) {
    const lead = await this.findOne(id);

    if (lead.pipelineStage !== PipelineStage.CONTRACT_SIGNED) {
      throw new BadRequestException('Lead must be in CONTRACT_SIGNED stage to convert');
    }

    const client = await this.prisma.$transaction(async (tx) => {
      // Guard: prevent double conversion
      const existing = await tx.client.findFirst({ where: { leadId: id } });
      if (existing) {
        throw new BadRequestException('Lead has already been converted to a client');
      }

      // Create Client
      const client = await tx.client.create({
        data: {
          leadId: lead.id,
          companyName: lead.companyName,
          contactName: lead.contactName,
          phoneWhatsapp: lead.phoneWhatsapp,
          email: lead.email,
          businessName: lead.businessName,
          businessType: lead.businessType,
          accountManager: lead.assignedTo,
          status: ClientStatus.ACTIVE,
        },
      });

      // Update Lead
      await tx.lead.update({
        where: { id },
        data: { isActive: false },
      });

      // Write CLIENT_CREATED history log
      await tx.clientHistoryLog.create({
        data: {
          clientId: client.id,
          userId,
          eventType: 'CLIENT_CREATED',
          description: 'Client created from lead conversion',
        },
      });

      return client;
    });

    // Notify the assigned user after the transaction succeeds
    if (lead.assignedTo) {
      await this.notificationsService.createNotification({
        entityId: client.id,
        entityType: 'lead',
        eventType: 'LEAD_CONVERTED',
        userId: lead.assignedTo,
        title: 'Lead Converted',
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
