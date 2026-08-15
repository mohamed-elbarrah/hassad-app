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
      throw new ApiException("AUTH_INVALID_CREDENTIALS", "Invalid credentials", 401);
    }

    // ── Lockout check ──────────────────────────────────────────────────
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new HttpException(
        `Account locked. Try again in ${remainingMin} minute(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // ── Suspension check ───────────────────────────────────────────────
    if (user.suspendedAt) {
      if (!user.suspendedUntil || user.suspendedUntil > new Date()) {
        throw new ApiException("AUTH_ACCOUNT_SUSPENDED", "User account is suspended.", 401);
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
      throw new ApiException("AUTH_ACCOUNT_INACTIVE", "User account is inactive", 401);
    }

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

      throw new ApiException("AUTH_INVALID_CREDENTIALS", "Invalid credentials", 401);
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

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      permissions,
    };
    const accessToken = this.jwtService.sign(payload);

    const refreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET");
    if (!refreshSecret) {
      throw new InternalServerErrorException(
        "JWT_REFRESH_SECRET is not configured",
      );
    }

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: "7d",
    });

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
      accessToken,
      refreshToken,
    };
  }

  async refresh(user: JwtPayload) {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions, // NEW - include permissions from JWT
    };
    return {
      accessToken: this.jwtService.sign(payload),
    };
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
    if (!user) throw new ApiException("AUTH_UNAUTHORIZED", "Authentication required", 401);

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
      throw new ConflictException("Email already in use");
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
      throw new ConflictException("Email already in use");
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
      throw new ApiException("AUTH_INVALID_RESET_TOKEN", "Invalid or expired reset token", 401);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    return { message: "Password reset successfully" };
  }
}
