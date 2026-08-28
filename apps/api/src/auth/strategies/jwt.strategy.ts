import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { JwtPayload } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => request?.cookies?.token,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_SECRET"),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Tokens issued before sid-backed sessions are never silently upgraded: force
    // an explicit login so a revoked legacy credential cannot regain access.
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
    return {
      id: payload.id,
      name: payload.name ?? "",
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      sid: payload.sid,
      ...(payload.impersonator && { impersonator: payload.impersonator }),
      ...(payload.impersonatorName && { impersonatorName: payload.impersonatorName }),
      ...(payload.reason && { reason: payload.reason }),
      ...(payload.type && { type: payload.type }),
    };
  }
}
