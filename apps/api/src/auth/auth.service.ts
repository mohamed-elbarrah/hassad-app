import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import {
  UserRole,
  ClientKind,
  ClientStatus,
  BusinessType,
} from "@hassad/shared";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { JwtPayload } from "../common/decorators/current-user.decorator";
import { CanonicalClientService } from "../modules/requests/canonical-client.service";
import { RegisterClientDto } from "./dto/register-client.dto";
import { RegisterInternalDto } from "./dto/register-internal.dto";
import { LoginDto } from "./dto/login.dto";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly canonicalClientService: CanonicalClientService,
  ) {}

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
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
        departments: {
          include: { department: true },
        },
      },
    });

    // Use generic message to avoid user enumeration
    if (!user) {
      throw new UnauthorizedException({ code: "INVALID_CREDENTIALS" });
    }

    // ── Lockout check ──────────────────────────────────────────────────
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new HttpException(
        {
          code: "ACCOUNT_LOCKED",
          details: { retryAfterSeconds: remainingMin * 60 },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // ── Suspension check ───────────────────────────────────────────────
    if (user.suspendedAt) {
      if (!user.suspendedUntil || user.suspendedUntil > new Date()) {
        throw new UnauthorizedException({ code: "ACCOUNT_SUSPENDED" });
      }
      // Suspension period has passed — auto-clear
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          suspendedAt: null,
          suspendedUntil: null,
          suspendReason: null,
          suspendedById: null,
        },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException({ code: "ACCOUNT_INACTIVE" });
    }

    // OAuth users don't have passwordHash
    if (!user.passwordHash) {
      throw new UnauthorizedException({ code: "SOCIAL_LOGIN_REQUIRED" });
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      const newFailedCount = user.failedLoginAttempts + 1;

      if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = new Date(
          Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
        );
        await this.prisma.$transaction([
          this.prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: newFailedCount,
              lockedUntil,
            },
          }),
          this.prisma.securityEvent.create({
            data: {
              userId: user.id,
              type: "ACCOUNT_LOCKED",
              ip,
              userAgent,
              metadata: {
                reason: "too_many_failed_attempts",
                failedAttempts: newFailedCount,
                lockoutDurationMinutes: LOCKOUT_DURATION_MINUTES,
              },
            },
          }),
          this.prisma.securityEvent.create({
            data: {
              userId: user.id,
              type: "LOGIN_FAILED",
              ip,
              userAgent,
              metadata: { attempt: newFailedCount, max: MAX_FAILED_ATTEMPTS },
            },
          }),
        ]);
      } else {
        await this.prisma.$transaction([
          this.prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: newFailedCount },
          }),
          this.prisma.securityEvent.create({
            data: {
              userId: user.id,
              type: "LOGIN_FAILED",
              ip,
              userAgent,
              metadata: { attempt: newFailedCount, max: MAX_FAILED_ATTEMPTS },
            },
          }),
        ]);
      }

      throw new UnauthorizedException({ code: "INVALID_CREDENTIALS" });
    }

    // ── Successful login: reset lockout state ──────────────────────────
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        }),
        this.prisma.securityEvent.create({
          data: {
            userId: user.id,
            type: "LOGIN_SUCCESS",
            ip,
            userAgent,
            metadata: { previousFailedAttempts: user.failedLoginAttempts },
          },
        }),
      ]);
    } else {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        }),
        this.prisma.securityEvent.create({
          data: {
            userId: user.id,
            type: "LOGIN_SUCCESS",
            ip,
            userAgent,
          },
        }),
      ]);
    }

    // Get permissions for JWT payload
    const permissions = [
      ...user.role.permissions.map((p: any) => p.permission.name),
      ...user.permissions.map((p: any) => p.permission.name),
    ];

    const tokens = await this.createSessionTokens(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name as UserRole,
        permissions,
      },
      ip,
      userAgent,
      dto.rememberMe ?? false,
    );

    let clientId: string | undefined;
    let intakeCompleted = false;
    if (user.role.name === UserRole.CLIENT) {
      const client = await this.prisma.client.findFirst({
        where: {
          userId: user.id,
        },
        select: { id: true, intakeCompleted: true },
      });
      clientId = client?.id ?? undefined;
      intakeCompleted = client?.intakeCompleted ?? false;
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        phoneWhatsapp: user.phoneWhatsapp,
        avatarUrl: user.avatarUrl,
        department: null,
        intakeCompleted,
        ...(clientId !== undefined && { clientId }),
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(user: JwtPayload) {
    const session = await this.getValidSession(user.sid, user.id);
    const profile = await this.getProfile(user.id);
    const payload = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      permissions: profile.permissions,
      sid: session.id,
      ...(user.impersonator && { impersonator: user.impersonator }),
      ...(user.impersonatorName && { impersonatorName: user.impersonatorName }),
      ...(user.reason && { reason: user.reason }),
      ...(user.type && { type: user.type }),
    };
    const refreshSecret =
      this.configService.getOrThrow<string>("JWT_REFRESH_SECRET");
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: Math.max(
        1,
        Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
      ),
    });
    const rotated = await this.prisma.session.updateMany({
      // Compare-and-swap prevents two concurrent refreshes from reusing one token.
      where: { id: session.id, refreshTokenHash: session.refreshTokenHash, revokedAt: null },
      data: { refreshTokenHash: await bcrypt.hash(refreshToken, 12) },
    });
    if (rotated.count !== 1) {
      throw new UnauthorizedException({ code: "INVALID_REFRESH_TOKEN", details: {} });
    }
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      refreshExpiresAt: session.expiresAt,
    };
  }

  private async getValidSession(sessionId: string, userId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
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
    return session;
  }

  async revokeSession(sessionId: string | undefined, userId: string) {
    if (!sessionId || !userId) return;
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Best-effort session revocation for logout. Signature validation is retained,
   * but expiration is ignored so stale credentials cannot prevent cleanup. */
  async revokeSessionFromRequest(req: Request) {
    const sessionIds = new Set<string>();
    const accessToken = req.cookies?.token;
    const refreshToken = req.cookies?.refreshToken;
    for (const [token, secret] of [
      [accessToken, this.configService.get<string>("JWT_SECRET")],
      [refreshToken, this.configService.get<string>("JWT_REFRESH_SECRET")],
    ] as const) {
      if (!token || !secret) continue;
      try {
        const payload = this.jwtService.verify<JwtPayload>(token, {
          secret,
          ignoreExpiration: true,
        });
        if (payload.sid && payload.id) sessionIds.add(`${payload.sid}:${payload.id}`);
      } catch {
        // Invalid credentials are still cleaned from the browser below.
      }
    }
    await Promise.all(
      [...sessionIds].map((key) => {
        const [sessionId, userId] = key.split(":");
        return this.revokeSession(sessionId, userId);
      }),
    );
  }

  async createSessionTokens(
    user: Omit<JwtPayload, "sid">,
    ip?: string,
    userAgent?: string,
    rememberMe = false,
    lifetimeSeconds?: number,
  ) {
    const refreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET");
    if (!refreshSecret) {
      throw new InternalServerErrorException({
        code: "AUTH_CONFIGURATION_ERROR",
        details: {},
      });
    }

    // Generate the identifier before signing so both tokens are bound to this database session.
    const sessionId = randomUUID();
    const payload = { ...user, sid: sessionId };
    const lifetime = lifetimeSeconds ?? (rememberMe ? 30 : 7) * 24 * 60 * 60;
    const expiresAt = new Date(Date.now() + lifetime * 1000);
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: lifetimeSeconds ?? "1h",
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: lifetime,
    });
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash,
        ip,
        userAgent,
        expiresAt,
      },
    });
    return { accessToken, refreshToken };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
        departments: {
          include: { department: true },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException({ code: "USER_NOT_FOUND" });
    }

    let clientId: string | undefined;
    let intakeCompleted = false;
    if (user.role.name === UserRole.CLIENT) {
      // Personal identity (name, email, phone) now lives on `User`
      // (single source of truth). The `Client` table no longer stores
      // these fields — we link a client to their portal login via
      // `userId` only.
      const client = await this.prisma.client.findFirst({
        where: {
          userId: user.id,
        },
        select: { id: true, intakeCompleted: true },
      });
      clientId = client?.id ?? undefined;
      intakeCompleted = client?.intakeCompleted ?? false;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      phoneWhatsapp: user.phoneWhatsapp,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role.name,
      permissions: [
        ...user.role.permissions.map((entry) => entry.permission.name),
        ...user.permissions.map((entry) => entry.permission.name),
      ],
      departments: user.departments.map((ud) => ud.department.name),
      intakeCompleted,
      ...(clientId !== undefined && { clientId }),
    };
  }

  async registerClient(dto: RegisterClientDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException({ code: "EMAIL_ALREADY_IN_USE" });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          phoneWhatsapp: dto.phone, // OWNERSHIP: User owns phone — single source of truth
          passwordHash,
          role: { connect: { name: UserRole.CLIENT } },
        },
      });

      await this.canonicalClientService.upsertCanonicalClient(tx, {
        userId: user.id,
        companyName: dto.name,
        businessName: dto.name,
        businessType: dto.businessType,
        kind: ClientKind.LEAD,
        status: ClientStatus.ACTIVE,
      });

      return { code: "USER_REGISTERED" };
    });
  }

  async registerInternal(dto: RegisterInternalDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException({ code: "EMAIL_ALREADY_IN_USE" });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: { connect: { name: dto.role } },
      },
      include: { role: true },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
    };
  }

  private assertAccountUsable(user: {
    isActive: boolean;
    suspendedAt: Date | null;
    suspendedUntil: Date | null;
  }) {
    if (!user.isActive) {
      throw new UnauthorizedException({
        code: "ACCOUNT_INACTIVE",
        details: {},
      });
    }
    if (
      user.suspendedAt &&
      (!user.suspendedUntil || user.suspendedUntil > new Date())
    ) {
      throw new UnauthorizedException({
        code: "ACCOUNT_SUSPENDED",
        details: {},
      });
    }
  }

  // ── OAuth (Google, Snapchat, etc.) ─────────────────────────────────────────

  async validateOAuthUser(data: {
    email: string;
    name: string;
    provider: string;
    providerId: string;
  }) {
    // 1. Try to find by providerId
    let user = await this.prisma.user.findUnique({
      where: { providerId: data.providerId },
      include: { role: true },
    });

    if (user) {
      this.assertAccountUsable(user);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      };
    }

    // 2. Try to find by email (auto-link)
    user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: { role: true },
    });

    if (user) {
      this.assertAccountUsable(user);
      // Auto-link: update provider info
      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          provider: data.provider,
          providerId: data.providerId,
        },
        include: { role: true },
      });
      return {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role.name,
      };
    }

    // 3. Create new user and attach it to the canonical client profile
    const newUser = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          provider: data.provider,
          providerId: data.providerId,
          role: { connect: { name: UserRole.CLIENT } },
        },
        include: { role: true },
      });

      await this.canonicalClientService.upsertCanonicalClient(tx, {
        userId: createdUser.id,
        companyName: data.name,
        businessName: data.name,
        businessType: BusinessType.OTHER,
        kind: ClientKind.LEAD,
        status: ClientStatus.ACTIVE,
      });

      return createdUser;
    });

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role.name,
    };
  }

  // ── Password Reset ──────────────────────────────────────────────────────────

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });
  }

  async generateResetToken(userId: string) {
    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        resetToken: token,
        resetTokenExpiresAt: expiresAt,
      },
    });

    return token;
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { resetToken: token },
    });

    if (
      !user ||
      !user.resetTokenExpiresAt ||
      user.resetTokenExpiresAt < new Date()
    ) {
      throw new UnauthorizedException({ code: "INVALID_RESET_TOKEN" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      const result = await tx.user.updateMany({
        where: {
          id: user.id,
          resetToken: token,
          resetTokenExpiresAt: { gt: new Date() },
        },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiresAt: null,
        },
      });
      if (result.count !== 1) {
        throw new UnauthorizedException({
          code: "INVALID_RESET_TOKEN",
          details: {},
        });
      }
      // Password changes invalidate every previously issued access/refresh JWT.
      await tx.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return result;
    });

    return { code: "PASSWORD_RESET" };
  }
}
