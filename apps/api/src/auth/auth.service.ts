import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from '@hassad/shared';
import { ConfigService } from '@nestjs/config';

// Temporary Prisma client instantiation for service if PrismaService is missing
// The proper way is injecting PrismaService. Let's use a global one or inject.
const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
       throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'default_refresh_secret',
      expiresIn: '7d',
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

  async refresh(user: any) {
    const payload = { id: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
