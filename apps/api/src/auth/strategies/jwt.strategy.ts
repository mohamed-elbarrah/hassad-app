import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { JwtPayload } from "../../common/decorators/current-user.decorator";
import { ApiException } from "../../common/errors/api-error";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>("JWT_SECRET");
    if (!secret) {
      throw new ApiException(
        "AUTH_UNAUTHORIZED",
        "Authentication configuration is not available",
        500,
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          return request?.cookies?.token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const sessionId = (payload as JwtPayload & { sessionId?: string })
      .sessionId;
    const rememberMe = (payload as JwtPayload & { rememberMe?: boolean })
      .rememberMe;
    if (!payload.id || !payload.email || !payload.role || !sessionId) {
      throw new ApiException(
        "AUTH_INVALID_TOKEN_PAYLOAD",
        "Invalid token payload",
        401,
      );
    }

    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId: payload.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!session) {
      throw new ApiException(
        "AUTH_UNAUTHORIZED",
        "Authentication required",
        401,
      );
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        permissions: {
          include: { permission: true },
        },
      },
    });
    if (!currentUser) {
      throw new ApiException(
        "AUTH_UNAUTHORIZED",
        "Authentication required",
        401,
      );
    }
    if (!currentUser.isActive) {
      throw new ApiException(
        "AUTH_ACCOUNT_INACTIVE",
        "User account is inactive",
        401,
      );
    }
    if (currentUser.suspendedAt) {
      if (
        !currentUser.suspendedUntil ||
        currentUser.suspendedUntil > new Date()
      ) {
        throw new ApiException(
          "AUTH_ACCOUNT_SUSPENDED",
          "User account is suspended.",
          401,
        );
      }

      await this.prisma.user.update({
        where: { id: currentUser.id },
        data: {
          suspendedAt: null,
          suspendedUntil: null,
          suspendReason: null,
          suspendedById: null,
        },
      });
    }

    const permissions = [
      ...currentUser.role.permissions.map((entry) => entry.permission.name),
      ...currentUser.permissions.map((entry) => entry.permission.name),
    ];

    return {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role.name,
      permissions,
      ...(sessionId && { sessionId }),
      ...(rememberMe !== undefined && { rememberMe }),
    } as JwtPayload;
  }
}
