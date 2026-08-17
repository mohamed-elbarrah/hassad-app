import { ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import { ApiException } from "../../common/errors/api-error";

@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const clientId = this.configService.get<string>("GOOGLE_CLIENT_ID");
    const clientSecret = this.configService.get<string>("GOOGLE_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      throw new ApiException(
        "AUTH_UNAUTHORIZED",
        "Google authentication is not configured",
        401,
      );
    }

    return super.canActivate(context);
  }

  handleRequest<TUser>(err: unknown, user: TUser | false | null): TUser {
    if (err instanceof ApiException) {
      const response = err.getResponse();
      const code =
        typeof response === "object" && response !== null && "code" in response
          ? response.code
          : undefined;
      if (
        code === "AUTH_ACCOUNT_LOCKED" ||
        code === "AUTH_ACCOUNT_SUSPENDED" ||
        code === "AUTH_ACCOUNT_INACTIVE"
      ) {
        throw err;
      }
    }

    if (err || !user) {
      throw new ApiException(
        "AUTH_UNAUTHORIZED",
        "Google authentication failed",
        401,
      );
    }

    return user;
  }
}
