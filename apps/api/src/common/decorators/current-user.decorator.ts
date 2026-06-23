import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { UserRole } from "@hassad/shared";

export interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions?: string[]; // NEW - optional permissions array
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as Record<string, unknown>;
    return data ? user?.[data] : (user as unknown as JwtPayload);
  },
);
