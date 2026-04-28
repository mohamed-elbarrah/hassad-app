import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, AddMemberDto } from '../dto/project.dto';
import { ContractStatus } from '@hassad/shared';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    if (!dto.contractId) {
      throw new BadRequestException('Project must be linked to a signed contract');
    }

    const contract = await this.prisma.contract.findUnique({
      where: { id: dto.contractId },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${dto.contractId} not found`);
    }

    if (contract.status !== ContractStatus.SIGNED && contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException(
        `Contract must be SIGNED or ACTIVE to create a project (current status: ${contract.status})`,
      );
    }

    return this.prisma.project.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        manager: true,
        members: {
          include: {
            user: true,
          },
        },
        tasks: true,
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  async archive(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });
  }

  async addMember(id: string, dto: AddMemberDto) {
    return this.prisma.projectMember.create({
      data: {
        projectId: id,
        userId: dto.userId,
        role: dto.role,
      },
    });
  }

  async removeMember(id: string, userId: string) {
    return this.prisma.projectMember.deleteMany({
      where: {
        projectId: id,
        userId: userId,
      },
    });
  }

  async findAll(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    clientId?: string;
    projectManagerId?: string;
  }) {
    const page = filters.page ? Number(filters.page) : 1;
    const limit = filters.limit ? Number(filters.limit) : 20;

    const where: Record<string, unknown> = {};
    if (filters.status) where['status'] = filters.status;
    if (filters.search) where['name'] = { contains: filters.search, mode: 'insensitive' };
    if (filters.clientId) where['clientId'] = filters.clientId;
    if (filters.projectManagerId) where['projectManagerId'] = filters.projectManagerId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        include: {
          client: { select: { id: true, companyName: true } },
          members: { select: { id: true, userId: true } },
          tasks: { select: { id: true, status: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.project.update({
      where: { id },
      data: { status: status as import('@prisma/client').ProjectStatus },
    });
  }
}
