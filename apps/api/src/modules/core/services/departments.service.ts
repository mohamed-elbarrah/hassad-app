import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDepartmentDto } from '../dto/rbac.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.department.findMany();
  }

  async create(dto: CreateDepartmentDto) {
    return this.prisma.department.create({
      data: dto,
    });
  }

  async assignToUser(userId: string, departmentId: string) {
    return this.prisma.userDepartment.create({
      data: {
        userId,
        departmentId,
      },
    });
  }
}
