import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../../common/decorators/roles.decorator";
import { ApiException } from "../../common/errors/api-error";
import { UserRole } from "@hassad/shared";
import type { Request } from "express";
import { JwtPayload } from "../../common/decorators/current-user.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload | undefined;

    if (!user || !user.role) {
      throw new ApiException("AUTH_ROLE_MISSING", "User role is missing", 403);
    }

    const hasRole = () => requiredRoles.includes(user.role);

    if (!hasRole()) {
      throw new ApiException(
        "AUTH_ROLE_FORBIDDEN",
        `Access restricted to roles: ${requiredRoles.join(", ")}`,
        403,
        { requiredRoles },
      );
    }

    return true;
  }
}
