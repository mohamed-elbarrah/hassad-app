import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { JwtPayload } from "../../common/decorators/current-user.decorator";
import { ApiException } from "../../common/errors/api-error";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          return request?.cookies?.token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET") ?? "default_secret",
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.id || !payload.email || !payload.role) {
      throw new ApiException("AUTH_INVALID_TOKEN_PAYLOAD", "Invalid token payload", 401);
    }
    return {
      id: payload.id,
      name: payload.name ?? "",
      email: payload.email,
      role: payload.role,
    };
  }
}
