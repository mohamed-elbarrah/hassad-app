import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import * as bcrypt from "bcrypt";
import { JwtPayload } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  "jwt-refresh",
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.refreshToken,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException({
        code: "REFRESH_TOKEN_REQUIRED",
        details: {},
      });
    }
    // Legacy refresh tokens have no server-side session binding. Require an
    // explicit re-authentication rather than accepting an unverifiable session.
    if (!payload.sid) {
      throw new UnauthorizedException({
        code: "LEGACY_TOKEN_REAUTH_REQUIRED",
        details: { requiresReauthentication: true },
      });
    }
    if (!payload.id || !payload.email || !payload.role) {
      throw new UnauthorizedException({ code: "INVALID_TOKEN", details: {} });
    }
    const session = await this.prisma.session.findFirst({
      where: { id: payload.sid, userId: payload.id },
      include: {
        user: {
          select: { isActive: true, suspendedAt: true, suspendedUntil: true },
        },
      },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException({ code: "SESSION_REVOKED", details: {} });
    }
    if (!(await bcrypt.compare(refreshToken, session.refreshTokenHash))) {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        details: {},
      });
    }
    if (!session.user.isActive) {
      throw new UnauthorizedException({
        code: "ACCOUNT_INACTIVE",
        details: {},
      });
    }
    if (
      session.user.suspendedAt &&
      (!session.user.suspendedUntil || session.user.suspendedUntil > new Date())
    ) {
      throw new UnauthorizedException({
        code: "ACCOUNT_SUSPENDED",
        details: {},
      });
    }
    return { ...payload, refreshToken };
  }
}
