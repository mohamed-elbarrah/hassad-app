import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { UserRole } from "@hassad/shared";

export interface JwtPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions?: string[];
  /** Database-backed session identity carried by current-generation JWTs. */
  sid?: string;
  /** Present on short-lived administrator impersonation tokens. */
  impersonator?: string;
  impersonatorName?: string;
  reason?: string;
  type?: "impersonation";
  /** Only populated by refresh validation; never used as an authority claim. */
  refreshToken?: string;
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as Record<string, unknown>;
    return data ? user?.[data] : (user as unknown as JwtPayload);
  },
);
