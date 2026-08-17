import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { JwtPayload } from "../../common/decorators/current-user.decorator";
import { ApiException } from "../../common/errors/api-error";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  "jwt-refresh",
) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>("JWT_REFRESH_SECRET");
    if (!secret) {
      throw new ApiException(
        "AUTH_REFRESH_SECRET_MISSING",
        "Refresh token service is not configured",
        500,
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refreshToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new ApiException(
        "AUTH_REFRESH_TOKEN_MISSING",
        "Refresh token is missing",
        401,
      );
    }
    return { ...payload, refreshToken };
  }
}
