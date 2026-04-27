import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateContractDto, CreateVersionDto } from '../dto/contract.dto';
import { ContractStatus, PipelineStage } from '@hassad/shared';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateContractDto) {
    return this.prisma.contract.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        createdBy: userId,
        status: ContractStatus.DRAFT,
      },
    });
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

  async sign(id: string, userId: string) {
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

      return updatedContract;
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
