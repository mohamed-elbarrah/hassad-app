import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  constructor(reflector: Reflector) {
    super(reflector);
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const hasCookieToken = Boolean(request.cookies?.token);
    const hasBearerToken = request.headers.authorization?.startsWith("Bearer ");

    if (!hasCookieToken && !hasBearerToken) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser>(
    err: unknown,
    user: TUser | false | null,
  ): TUser | undefined {
    if (err || !user) return undefined;
    return user;
  }
}
