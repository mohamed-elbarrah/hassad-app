import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateRoleDto, AssignPermissionsDto } from "../dto/rbac.dto";
import {
  badRequest,
  conflict,
  notFound,
} from "../../../common/errors/domain-errors";

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
    try {
      return await this.prisma.role.create({ data: createRoleDto });
    } catch (error) {
      if (this.isPrismaError(error, "P2002")) {
        throw conflict(
          "ROLE_NAME_ALREADY_EXISTS",
          "A role with this name already exists",
          { name: createRoleDto.name },
        );
      }
      throw error;
    }
  }

  async update(id: string, updateRoleDto: CreateRoleDto) {
    try {
      return await this.prisma.role.update({
        where: { id },
        data: updateRoleDto,
      });
    } catch (error) {
      if (this.isPrismaError(error, "P2002")) {
        throw conflict(
          "ROLE_NAME_ALREADY_EXISTS",
          "A role with this name already exists",
          { name: updateRoleDto.name },
        );
      }
      if (this.isPrismaError(error, "P2025")) {
        throw notFound("ROLE_NOT_FOUND", `Role with ID ${id} not found`, {
          roleId: id,
        });
      }
      throw error;
    }
  }

  async assignPermissions(id: string, dto: AssignPermissionsDto) {
    if (new Set(dto.permissionIds).size !== dto.permissionIds.length) {
      throw badRequest(
        "ROLE_PERMISSION_DUPLICATE",
        "Permission IDs must be unique",
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const role = await tx.role.findUnique({ where: { id } });
        if (!role) {
          throw notFound("ROLE_NOT_FOUND", `Role with ID ${id} not found`, {
            roleId: id,
          });
        }

        const permissions = dto.permissionIds.length
          ? await tx.permission.findMany({
              where: { id: { in: dto.permissionIds } },
              select: { id: true },
            })
          : [];
        const foundIds = new Set(
          permissions.map((permission) => permission.id),
        );
        const missingPermissionId = dto.permissionIds.find(
          (permissionId) => !foundIds.has(permissionId),
        );
        if (missingPermissionId) {
          throw notFound(
            "PERMISSION_NOT_FOUND",
            `Permission with ID ${missingPermissionId} not found`,
            { permissionId: missingPermissionId },
          );
        }

        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        return dto.permissionIds.length
          ? tx.rolePermission.createMany({
              data: dto.permissionIds.map((permissionId) => ({
                roleId: id,
                permissionId,
              })),
            })
          : { count: 0 };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw notFound(
          "ROLE_PERMISSION_REFERENCE_NOT_FOUND",
          "The role or permission reference is no longer available",
        );
      }
      if (this.isPrismaError(error, "P2002")) {
        throw conflict(
          "ROLE_PERMISSION_ALREADY_ASSIGNED",
          "One or more permissions are already assigned to this role",
          { roleId: id },
        );
      }
      if (this.isPrismaError(error, "P2025")) {
        throw notFound("ROLE_NOT_FOUND", `Role with ID ${id} not found`, {
          roleId: id,
        });
      }
      throw error;
    }
  }

  private isPrismaError(error: unknown, code: string): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === code
    );
  }
}
