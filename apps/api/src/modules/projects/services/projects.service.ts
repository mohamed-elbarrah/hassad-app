import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, AddMemberDto } from '../dto/project.dto';

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
}
