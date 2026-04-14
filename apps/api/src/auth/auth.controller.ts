import { Controller, Post, Body, Get, UseGuards, Request, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from '@hassad/shared';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request as ExpressRequest } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.authService.login(dto);
    
    // Refresh Token Cookie (Long-lived)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Number(this.configService.get<number>('COOKIE_REFRESH_TOKEN_MAX_AGE')) || 7 * 24 * 60 * 60 * 1000, 
    });

    // Access Token Cookie (Short-lived, matches middleware expectations)
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Number(this.configService.get<number>('COOKIE_TOKEN_MAX_AGE')) || 60 * 60 * 1000, 
    });

    return {
      user,
      accessToken,
    };
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  async refresh(
    @Request() req: ExpressRequest & { user: JwtPayload },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken } = await this.authService.refresh(req.user);
    
    // Update Access Token Cookie
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Number(this.configService.get<number>('COOKIE_TOKEN_MAX_AGE')) || 60 * 60 * 1000,
    });

    return { accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.id);
  }
}
