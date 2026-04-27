import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateRoleDto, AssignPermissionsDto } from '../dto/rbac.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async create(createRoleDto: CreateRoleDto) {
    return this.prisma.role.create({
      data: createRoleDto,
    });
  }

  async update(id: string, updateRoleDto: CreateRoleDto) {
    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });
  }

  async assignPermissions(id: string, dto: AssignPermissionsDto) {
    // Delete existing permissions for this role
    await this.prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // Create new ones
    return this.prisma.rolePermission.createMany({
      data: dto.permissionIds.map((pId) => ({
        roleId: id,
        permissionId: pId,
      })),
    });
  }
}
