import { ExecutionContext, HttpException, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";

export interface OAuthGuardFailure {
  authErrorCode: string;
}

function errorCode(error: unknown): string {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    if (
      typeof response === "object" &&
      response !== null &&
      "code" in response &&
      typeof response.code === "string"
    ) {
      return response.code;
    }
  }

  return "OAUTH_FAILED";
}

@Injectable()
export class GoogleOAuthGuard extends AuthGuard("google") {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const clientId = this.configService.get<string>("GOOGLE_CLIENT_ID");
    const clientSecret = this.configService.get<string>("GOOGLE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      this.redirectToLogin(context, "OAUTH_NOT_CONFIGURED");
      // Allow Nest to finish the request after the redirect. The controller
      // checks headersSent and will not attempt a second response.
      return true;
    }

    return super.canActivate(context) as boolean | Promise<boolean>;
  }

  handleRequest<TUser = unknown>(
    error: unknown,
    user: TUser,
    _info: unknown,
  ): TUser {
    if (error) return { authErrorCode: errorCode(error) } as TUser;
    return user ?? ({ authErrorCode: "OAUTH_FAILED" } as TUser);
  }

  private redirectToLogin(context: ExecutionContext, code: string) {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const frontendUrl =
      this.configService.get<string>("FRONTEND_URL") ??
      `${request.protocol}://${request.get("host")}`;
    const loginUrl = new URL("/login", frontendUrl);
    loginUrl.searchParams.set("error", code);
    response.redirect(loginUrl.toString());
  }
}
