import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { ApiException } from "../../common/errors/api-error";

@Injectable()
export class JwtRefreshGuard extends AuthGuard("jwt-refresh") {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.cookies?.refreshToken) {
      throw new ApiException(
        "AUTH_REFRESH_TOKEN_MISSING",
        "Refresh token is missing",
        401,
      );
    }

    return super.canActivate(context);
  }

  handleRequest<TUser>(err: unknown, user: TUser | false | null): TUser {
    if (err instanceof ApiException) {
      throw err;
    }
    if (err || !user) {
      throw new ApiException(
        "AUTH_UNAUTHORIZED",
        "Authentication required",
        401,
      );
    }
    return user;
  }
}
