import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException({
        code: "AUTHENTICATION_REQUIRED",
        details: {},
      });
    }

    // Always read current permissions from the database. JWT permissions can be stale
    // after an administrator changes a user's grants.
    const userWithPermissions = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!userWithPermissions || !userWithPermissions.role) {
      throw new ForbiddenException({
        code: "PERMISSION_DENIED",
        details: {},
      });
    }

    if (!userWithPermissions.isActive) {
      throw new ForbiddenException({ code: "ACCOUNT_INACTIVE", details: {} });
    }
    if (
      userWithPermissions.suspendedAt &&
      (!userWithPermissions.suspendedUntil ||
        userWithPermissions.suspendedUntil > new Date())
    ) {
      throw new ForbiddenException({ code: "ACCOUNT_SUSPENDED", details: {} });
    }

    if (userWithPermissions.role.name === "ADMIN") {
      return true;
    }

    const rolePermissions = userWithPermissions.role.permissions.map(
      (rp) => rp.permission.name,
    );
    const directPermissions = userWithPermissions.permissions.map(
      (up) => up.permission.name,
    );

    const allPermissions = new Set([...rolePermissions, ...directPermissions]);

    const hasPermission = requiredPermissions.every((permission) =>
      allPermissions.has(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException({
        code: "PERMISSION_DENIED",
        details: { requiredPermissions },
      });
    }

    return true;
  }
}
