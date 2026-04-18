import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { LoginDto, UserRole, ClientSource } from "@hassad/shared";
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
    });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("User account is inactive");
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
      role: user.role,
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
        role: user.role,
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
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
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
          role: UserRole.CLIENT,
        },
      });

      // Self-registered clients must be assigned to a SALES user so they appear
      // in each SALES user's pipeline view (which filters by assignedToId = sales.id).
      // If no SALES user exists yet, fall back to the first ADMIN.
      const salesUser = await tx.user.findFirst({
        where: { role: UserRole.SALES, isActive: true },
        select: { id: true },
      });
      const adminUser = !salesUser
        ? await tx.user.findFirst({
            where: { role: UserRole.ADMIN },
            select: { id: true },
          })
        : null;
      const assignedToId = salesUser?.id ?? adminUser?.id ?? user.id;

      await tx.client.create({
        data: {
          name: dto.name,
          phone: dto.phone,
          businessType: dto.businessType,
          source: ClientSource.PLATFORM,
          status: "LEAD",
          stage: "NEW_LEAD",
          assignedToId,
          activityLog: [
            {
              action: "CLIENT_CREATED",
              userId: user.id,
              timestamp: new Date().toISOString(),
            },
          ],
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
        role: dto.role,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return user;
  }
}
