import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { UserRole } from "@hassad/shared";
import { UserSearchFiltersDto } from "./dto/user-search-filters.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async searchUsers(filters: UserSearchFiltersDto) {
    const andConditions: Prisma.UserWhereInput[] = [{ isActive: true }];

    if (filters.role) {
      andConditions.push({ role: filters.role });
    }

    // When filtering by department, also include ADMIN users (they work across all depts)
    if (filters.department) {
      andConditions.push({
        OR: [{ department: filters.department }, { role: UserRole.ADMIN }],
      });
    }

    if (filters.search) {
      andConditions.push({
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
        ],
      });
    }

    const where: Prisma.UserWhereInput = { AND: andConditions };

    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
