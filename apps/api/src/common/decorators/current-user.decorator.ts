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
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as JwtPayload;
  },
);
