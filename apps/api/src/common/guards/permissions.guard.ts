import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { ApiException } from "../errors/api-error";

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
      throw new ApiException("AUTHENTICATION_REQUIRED", "User not authenticated", 401);
    }

    // Admin has all permissions
    if (user.role === "ADMIN") {
      return true;
    }

    // Fast path: JWT has all required permissions → skip DB lookup
    if (
      user.permissions &&
      Array.isArray(user.permissions) &&
      requiredPermissions.every((permission) =>
        user.permissions.includes(permission),
      )
    ) {
      return true;
    }

    // Fallback to DB lookup (JWT may be stale — permission granted after token was issued)
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

    if (!userWithPermissions) {
      return false;
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
      throw new ApiException(
        "PERMISSION_MISSING",
        "Missing required permissions",
        403,
        { requiredPermissions },
      );
    }

    return true;
  }
}
