import {
  Injectable,
  UnauthorizedException,
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
import { JwtPayload } from "../common/decorators/current-user.decorator";
import { RegisterClientDto } from "./dto/register-client.dto";
import { RegisterInternalDto } from "./dto/register-internal.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("User account is inactive");
    }

    // OAuth users don't have passwordHash
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        "This account uses social login. Please sign in with your provider.",
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
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

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        department: null, // departments is now an array, returning null for legacy compat
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
    };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        departments: {
          include: {
            department: true,
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException();

    let clientId: string | undefined;
    if (user.role.name === UserRole.CLIENT) {
      const client = await this.prisma.client.findFirst({
        where: { email: user.email },
        select: { id: true },
      });
      clientId = client?.id ?? undefined;
    }

    return {
      ...user,
      role: user.role.name,
      departments: user.departments.map((ud) => ud.department.name),
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
          passwordHash,
          role: { connect: { name: UserRole.CLIENT } },
        },
      });

      const salesUser = await tx.user.findFirst({
        where: { role: { name: UserRole.SALES }, isActive: true },
        select: { id: true },
      });
      const adminUser = !salesUser
        ? await tx.user.findFirst({
            where: { role: { name: UserRole.ADMIN } },
            select: { id: true },
          })
        : null;
      const assignedToId = salesUser?.id ?? adminUser?.id ?? user.id;

      await tx.client.create({
        data: {
          companyName: dto.name, // Using name as companyName for now
          contactName: dto.name,
          phoneWhatsapp: dto.phone,
          email: dto.email,
          businessName: dto.name,
          businessType: dto.businessType,
          accountManager: assignedToId,
          status: ClientStatus.ACTIVE,
          leadId: null, // Self-registered client
        },
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

    // 3. Create new user
    const newUser = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        provider: data.provider,
        providerId: data.providerId,
        role: { connect: { name: UserRole.CLIENT } },
      },
      include: { role: true },
    });

    // Create client record for new OAuth user
    await this.prisma.client.create({
      data: {
        companyName: data.name,
        contactName: data.name,
        phoneWhatsapp: "00000000000",
        email: data.email,
        businessName: data.name,
        businessType: BusinessType.OTHER,
        status: ClientStatus.ACTIVE,
      },
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
      throw new UnauthorizedException("Invalid or expired reset token");
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
