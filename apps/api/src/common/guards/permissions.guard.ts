import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admin has all permissions
    if (user.role === 'ADMIN') {
      return true;
    }

    // Fetch user permissions from DB (via Role and direct UserPermissions)
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
      throw new ForbiddenException('Missing required permissions');
    }

    return true;
  }
}
