import { Injectable, HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import {
  LoginDto,
  UserRole,
  ClientSource,
  ClientStatus,
  PipelineStage,
  BusinessType,
} from "@hassad/shared";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { ApiException } from "../common/errors/api-error";
import { JwtPayload } from "../common/decorators/current-user.decorator";
import { CanonicalClientService } from "../modules/requests/canonical-client.service";
import { RegisterClientDto } from "./dto/register-client.dto";
import { RegisterInternalDto } from "./dto/register-internal.dto";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
export const DEFAULT_ACCESS_TOKEN_LIFETIME_MS = 60 * 60 * 1000;
export const REMEMBERED_ACCESS_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
export const DEFAULT_REFRESH_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
export const REMEMBERED_REFRESH_TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

export function configuredJwtLifetimeMs(
  value: string | number | undefined,
  fallbackMs: number,
): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value * 1000;
  }
  if (typeof value !== "string") return fallbackMs;

  const match = value.trim().match(/^(\d+(?:\.\d+)?)(ms|s|m|h|d|w)$/i);
  if (!match) return fallbackMs;

  const amount = Number(match[1]);
  const unitMs: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };
  return amount * unitMs[match[2].toLowerCase()];
}

export function configuredCookieMaxAgeMs(
  value: string | number | undefined,
  fallbackMs: number,
): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value.trim())) {
    return Number(value);
  }
  return configuredJwtLifetimeMs(value, fallbackMs);
}

export function accessTokenLifetimeMs(
  rememberMe = false,
  normalLifetimeMs = DEFAULT_ACCESS_TOKEN_LIFETIME_MS,
): number {
  return rememberMe ? REMEMBERED_ACCESS_TOKEN_LIFETIME_MS : normalLifetimeMs;
}

export function refreshTokenLifetimeMs(
  rememberMe = false,
  normalLifetimeMs = DEFAULT_REFRESH_TOKEN_LIFETIME_MS,
): number {
  return rememberMe ? REMEMBERED_REFRESH_TOKEN_LIFETIME_MS : normalLifetimeMs;
}

type AuthRefreshPayload = JwtPayload & {
  sessionId?: string;
  refreshToken?: string;
  rememberMe?: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly canonicalClientService: CanonicalClientService,
  ) {}

  private getRefreshSecret(): string {
    const refreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET");
    if (!refreshSecret) {
      throw new ApiException(
        "AUTH_REFRESH_SECRET_MISSING",
        "Refresh token service is not configured",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return refreshSecret;
  }

  private async ensureAccountCanAuthenticate(user: any): Promise<void> {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new ApiException(
        "AUTH_ACCOUNT_LOCKED",
        `Account locked. Try again in ${remainingMin} minute(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
        { remainingMinutes: remainingMin },
      );
    }

    if (user.suspendedAt) {
      if (!user.suspendedUntil || user.suspendedUntil > new Date()) {
        throw new ApiException(
          "AUTH_ACCOUNT_SUSPENDED",
          "User account is suspended.",
          401,
        );
      }

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
      throw new ApiException(
        "AUTH_ACCOUNT_INACTIVE",
        "User account is inactive",
        401,
      );
    }
  }

  private async findAuthUser(userId: string) {
    return this.prisma.user.findUnique({
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
  }

  private async issueTokensForUser(
    user: any,
    options: { rememberMe?: boolean; ip?: string; userAgent?: string } = {},
  ) {
    const refreshSecret = this.getRefreshSecret();
    const sessionId = randomUUID();
    const rememberMe = options.rememberMe === true;
    const accessLifetimeMs = accessTokenLifetimeMs(
      rememberMe,
      configuredJwtLifetimeMs(
        this.configService.get<string | number>("JWT_EXPIRES_IN"),
        DEFAULT_ACCESS_TOKEN_LIFETIME_MS,
      ),
    );
    const refreshLifetimeMs = refreshTokenLifetimeMs(
      rememberMe,
      configuredJwtLifetimeMs(
        this.configService.get<string | number>("JWT_REFRESH_EXPIRES_IN"),
        DEFAULT_REFRESH_TOKEN_LIFETIME_MS,
      ),
    );
    const refreshTokenExpiresAt = new Date(Date.now() + refreshLifetimeMs);
    const permissions = [
      ...user.role.permissions.map((p: any) => p.permission.name),
      ...user.permissions.map((p: any) => p.permission.name),
    ];
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      permissions,
      sessionId,
      rememberMe,
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: Math.floor(accessLifetimeMs / 1000),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: Math.floor(refreshLifetimeMs / 1000),
    });
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash,
        userAgent: options.userAgent,
        ip: options.ip,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    let clientId: string | undefined;
    let intakeCompleted = false;
    if (user.role.name === UserRole.CLIENT) {
      const client = await this.prisma.client.findFirst({
        where: { userId: user.id },
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
      accessToken,
      refreshToken,
    };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const rememberMe = dto.rememberMe === true;
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
      throw new ApiException(
        "AUTH_INVALID_CREDENTIALS",
        "Invalid credentials",
        401,
      );
    }

    await this.ensureAccountCanAuthenticate(user);

    // OAuth users don't have passwordHash
    if (!user.passwordHash) {
      throw new ApiException(
        "AUTH_SOCIAL_LOGIN_REQUIRED",
        "This account uses social login. Please sign in with your provider.",
        401,
      );
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

      throw new ApiException(
        "AUTH_INVALID_CREDENTIALS",
        "Invalid credentials",
        401,
      );
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

    return this.issueTokensForUser(user, {
      rememberMe,
      ip,
      userAgent,
    });
  }

  async refresh(user: AuthRefreshPayload) {
    if (!user.sessionId || !user.refreshToken) {
      throw new ApiException(
        "AUTH_UNAUTHORIZED",
        "Authentication required",
        401,
      );
    }

    const session = await this.prisma.session.findUnique({
      where: { id: user.sessionId },
    });
    if (
      !session ||
      session.userId !== user.id ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !(await bcrypt.compare(user.refreshToken, session.refreshTokenHash))
    ) {
      throw new ApiException(
        "AUTH_UNAUTHORIZED",
        "Authentication required",
        401,
      );
    }

    const currentUser = await this.findAuthUser(user.id);
    if (!currentUser) {
      throw new ApiException(
        "AUTH_UNAUTHORIZED",
        "Authentication required",
        401,
      );
    }
    await this.ensureAccountCanAuthenticate(currentUser);

    const rememberMe = user.rememberMe === true;
    const normalAccessLifetimeMs = configuredJwtLifetimeMs(
      this.configService.get<string | number>("JWT_EXPIRES_IN"),
      DEFAULT_ACCESS_TOKEN_LIFETIME_MS,
    );
    const permissions = [
      ...currentUser.role.permissions.map((p: any) => p.permission.name),
      ...currentUser.permissions.map((p: any) => p.permission.name),
    ];
    const payload = {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role.name,
      permissions,
      sessionId: session.id,
      rememberMe,
    };
    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: Math.floor(
          accessTokenLifetimeMs(rememberMe, normalAccessLifetimeMs) / 1000,
        ),
      }),
      rememberMe,
    };
  }

  async issueOAuthTokens(userId: string, ip?: string, userAgent?: string) {
    const user = await this.findAuthUser(userId);
    if (!user) {
      throw new ApiException(
        "AUTH_UNAUTHORIZED",
        "Authentication required",
        401,
      );
    }
    await this.ensureAccountCanAuthenticate(user);
    return this.issueTokensForUser(user, { ip, userAgent });
  }

  async revokeSession(sessionId?: string): Promise<void> {
    if (!sessionId) return;
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeSessionFromRefreshToken(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;

    const refreshSecret = this.getRefreshSecret();
    let payload: AuthRefreshPayload;
    try {
      payload = this.jwtService.verify<AuthRefreshPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      // Logout remains idempotent for malformed or expired refresh tokens.
      return;
    }

    if (!payload.id || !payload.sessionId) return;

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
    });
    if (
      !session ||
      session.userId !== payload.id ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !(await bcrypt.compare(refreshToken, session.refreshTokenHash))
    ) {
      return;
    }

    await this.revokeSession(session.id);
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
    if (!user)
      throw new ApiException(
        "AUTH_UNAUTHORIZED",
        "Authentication required",
        401,
      );

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
      throw new ApiException(
        "AUTH_EMAIL_ALREADY_EXISTS",
        "Email already in use",
        HttpStatus.CONFLICT,
      );
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
        status: ClientStatus.LEAD,
      });

      return { message: "Registration successful. Please log in." };
    });
  }

  async registerInternal(dto: RegisterInternalDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ApiException(
        "AUTH_EMAIL_ALREADY_EXISTS",
        "Email already in use",
        HttpStatus.CONFLICT,
      );
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
      await this.ensureAccountCanAuthenticate(user);
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
      await this.ensureAccountCanAuthenticate(user);
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
        status: ClientStatus.LEAD,
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
    const tokenDigest = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        resetToken: tokenDigest,
        resetTokenExpiresAt: expiresAt,
      },
    });

    return token;
  }

  async resetPassword(token: string, newPassword: string) {
    const crypto = await import("crypto");
    const tokenDigest = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date();
    const user = await this.prisma.user.findUnique({
      where: { resetToken: tokenDigest },
    });

    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt <= now) {
      throw new ApiException(
        "AUTH_INVALID_RESET_TOKEN",
        "Invalid or expired reset token",
        401,
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.user.updateMany({
        where: {
          id: user.id,
          resetToken: tokenDigest,
          resetTokenExpiresAt: { gt: now },
        },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiresAt: null,
        },
      });
      if (updateResult.count !== 1) {
        throw new ApiException(
          "AUTH_INVALID_RESET_TOKEN",
          "Invalid or expired reset token",
          401,
        );
      }

      await tx.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return { message: "Password reset successfully" };
  }
}
