import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import {
  CreateContractDto,
  UpdateContractDto,
  SignContractDto,
  SignByTokenDto,
  CreateVersionDto,
} from '../dto/contract.dto';
import { ClientStatus, ContractStatus, PipelineStage } from '@hassad/shared';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * One-step: create contract + immediately set SENT + generate shareLinkToken.
   * Auto-creates a Client record from the Lead if one doesn't exist yet.
   * Notifies the CLIENT user (lead.createdBy) fire-and-forget.
   */
  async create(userId: string, filePath: string, dto: CreateContractDto) {
    // 1. Fetch lead — needed both for auto-create Client and for notification
    const lead = await this.prisma.lead.findUnique({
      where: { id: dto.leadId },
      select: {
        createdBy: true,
        companyName: true,
        contactName: true,
        phoneWhatsapp: true,
        email: true,
        businessName: true,
        businessType: true,
      },
    });
    if (!lead) {
      throw new BadRequestException('العميل المحتمل غير موجود');
    }

    // 2. Resolve clientId — auto-create a Client from Lead data if none exists yet
    const client = await this.prisma.client.upsert({
      where: { leadId: dto.leadId },
      create: {
        leadId: dto.leadId,
        companyName: lead.companyName,
        contactName: lead.contactName,
        phoneWhatsapp: lead.phoneWhatsapp,
        email: lead.email,
        businessName: lead.businessName,
        businessType: lead.businessType,
        status: ClientStatus.LEAD,
      },
      update: {},
    });

    const shareLinkToken = randomUUID();

    // 3. Create contract as SENT in one step
    const contract = await this.prisma.contract.create({
      data: {
        clientId: client.id,
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

    // 4. Notify CLIENT (fire-and-forget)
    if (lead?.createdBy) {
      this.notificationsService
        .createNotification({
          entityId: shareLinkToken, // token so client can navigate directly to detail
          entityType: 'contract',
          eventType: 'CONTRACT_SENT',
          userId: lead.createdBy,
          title: 'عقد جديد بانتظار توقيعك',
          body: `العقد "${contract.title}" جاهز لمراجعته وتوقيعه`,
        })
        .catch(() => undefined);
    }

    return { ...contract, shareLinkToken };
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        client: true,
        versions: true,
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
            leadId: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('العقد غير موجود أو انتهت صلاحية الرابط');
    }

    return contract;
  }

  /** Public: CLIENT signs the contract via share link token */
  async signByToken(token: string, dto: SignByTokenDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { shareLinkToken: token },
      include: {
        client: { select: { leadId: true } },
      },
    });

    if (!contract) {
      throw new NotFoundException('العقد غير موجود');
    }

    if (contract.status !== ContractStatus.SENT) {
      throw new BadRequestException(
        'لا يمكن توقيع هذا العقد في وضعه الحالي',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Sign the contract
      const signed = await tx.contract.update({
        where: { id: contract.id },
        data: {
          status: ContractStatus.SIGNED,
          eSigned: true,
          signedAt: new Date(),
        },
      });

      // 2. Advance lead stage to CONTRACT_SIGNED
      if (contract.client.leadId) {
        const lead = await tx.lead.findUnique({
          where: { id: contract.client.leadId },
          select: { pipelineStage: true },
        });

        await tx.lead.update({
          where: { id: contract.client.leadId },
          data: { pipelineStage: PipelineStage.CONTRACT_SIGNED },
        });

        if (lead) {
          await tx.leadPipelineHistory.create({
            data: {
              leadId: contract.client.leadId,
              fromStage: lead.pipelineStage,
              toStage: PipelineStage.CONTRACT_SIGNED,
              changedBy: contract.createdBy, // creator as proxy
            },
          });
        }
      }

      // 3. Notify SALES creator (fire-and-forget)
      this.notificationsService
        .createNotification({
          entityId: signed.id,
          entityType: 'contract',
          eventType: 'CONTRACT_SIGNED',
          userId: contract.createdBy,
          title: 'تم توقيع العقد',
          body: `العميل وقّع على العقد "${contract.title}"`,
        })
        .catch(() => undefined);

      return { ...signed, signedByName: dto.signedByName };
    });
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
    await this.findOne(id);

    return this.prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.SENT,
      },
    });
  }

  async sign(id: string, userId: string, dto: SignContractDto) {
    const contract = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const updatedContract = await tx.contract.update({
        where: { id },
        data: {
          status: ContractStatus.SIGNED,
          eSigned: true,
          signedAt: new Date(),
        },
      });

      // Update lead stage to CONTRACT_SIGNED and record history
      if (contract.client.leadId) {
        const lead = await tx.lead.findUnique({
          where: { id: contract.client.leadId },
          select: { pipelineStage: true },
        });

        await tx.lead.update({
          where: { id: contract.client.leadId },
          data: { pipelineStage: PipelineStage.CONTRACT_SIGNED },
        });

        if (lead) {
          await tx.leadPipelineHistory.create({
            data: {
              leadId: contract.client.leadId,
              fromStage: lead.pipelineStage,
              toStage: PipelineStage.CONTRACT_SIGNED,
              changedBy: userId,
            },
          });
        }
      }

      return { ...updatedContract, signedByName: dto.signedByName };
    });
  }

  async activate(id: string) {
    return this.prisma.contract.update({
      where: { id },
      data: { status: ContractStatus.ACTIVE },
    });
  }

  async cancel(id: string) {
    return this.prisma.contract.update({
      where: { id },
      data: { status: ContractStatus.CANCELLED },
    });
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
      where.title = { contains: filters.search, mode: 'insensitive' };
    const [items, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        include: { client: { select: { id: true, companyName: true } } },
        orderBy: { createdAt: 'desc' },
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
        client: {
          lead: { createdBy: userId },
        },
      },
      include: {
        client: {
          select: { id: true, companyName: true, contactName: true, leadId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
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
