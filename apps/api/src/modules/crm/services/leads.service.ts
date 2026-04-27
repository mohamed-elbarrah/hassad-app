import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadDto, AssignLeadDto, CreateContactLogDto, ChangeLeadStageDto } from '../dto/lead.dto';
import { PipelineStage, ClientStatus } from '@hassad/shared';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.$transaction(async (tx) => {
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

      // TODO: Emit notification event

      return client;
    });
  }
  async remove(id: string) {
    return this.prisma.lead.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
