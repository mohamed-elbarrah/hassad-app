import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateDepartmentDto } from "../dto/rbac.dto";
import { conflict, notFound } from "../../../common/errors/domain-errors";

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.department.findMany();
  }

  async create(dto: CreateDepartmentDto) {
    try {
      return await this.prisma.department.create({ data: dto });
    } catch (error) {
      if (this.isPrismaError(error, "P2002")) {
        throw conflict(
          "DEPARTMENT_NAME_ALREADY_EXISTS",
          "A department with this name already exists",
          { name: dto.name },
        );
      }
      throw error;
    }
  }

  async assignToUser(userId: string, departmentId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });
        if (!user) {
          throw notFound("USER_NOT_FOUND", `User with ID ${userId} not found`, {
            userId,
          });
        }

        const department = await tx.department.findUnique({
          where: { id: departmentId },
          select: { id: true },
        });
        if (!department) {
          throw notFound(
            "DEPARTMENT_NOT_FOUND",
            `Department with ID ${departmentId} not found`,
            { departmentId },
          );
        }

        return tx.userDepartment.create({
          data: { userId, departmentId },
        });
      });
    } catch (error) {
      if (this.isPrismaError(error, "P2002")) {
        throw conflict(
          "USER_DEPARTMENT_ALREADY_ASSIGNED",
          "This department is already assigned to the user",
          { userId, departmentId },
        );
      }
      if (this.isPrismaError(error, "P2003")) {
        throw notFound(
          "USER_DEPARTMENT_REFERENCE_NOT_FOUND",
          "The user or department reference is no longer available",
          { userId, departmentId },
        );
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
