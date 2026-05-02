import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Res,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { LoginDto, UserRole } from "@hassad/shared";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import {
  CurrentUser,
  JwtPayload,
} from "../common/decorators/current-user.decorator";
import { AuthGuard } from "@nestjs/passport";
import { Response, Request as ExpressRequest } from "express";
import { RegisterClientDto } from "./dto/register-client.dto";
import { RegisterInternalDto } from "./dto/register-internal.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { EmailService } from "../common/services/email.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(dto);

    // Check rememberMe from body (not part of LoginDto, but passed optionally)
    const rememberMe = (dto as LoginDto & { rememberMe?: boolean }).rememberMe;

    const refreshMaxAge = rememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 days
      : Number(
          this.configService.get<number>("COOKIE_REFRESH_TOKEN_MAX_AGE"),
        ) || 7 * 24 * 60 * 60 * 1000; // 7 days default

    const tokenMaxAge = rememberMe
      ? 7 * 24 * 60 * 60 * 1000 // 7 days
      : Number(this.configService.get<number>("COOKIE_TOKEN_MAX_AGE")) ||
        60 * 60 * 1000; // 1 hour default

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: refreshMaxAge,
    });

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: tokenMaxAge,
    });

    return { user, accessToken };
  }

  @UseGuards(AuthGuard("jwt-refresh"))
  @Post("refresh")
  async refresh(
    @Request() req: ExpressRequest & { user: JwtPayload },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken } = await this.authService.refresh(req.user);

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge:
        Number(this.configService.get<number>("COOKIE_TOKEN_MAX_AGE")) ||
        60 * 60 * 1000,
    });

    return { accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.id);
  }

  /** POST /auth/logout — clears all auth cookies */
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    res.cookie("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return { message: "Logged out successfully" };
  }

  /** POST /auth/forgot-password — sends reset email */
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const user = await this.authService.findByEmail(dto.email);
    if (!user) {
      // Don't leak whether email exists
      return { message: "If this email exists, a reset link has been sent." };
    }

    const token = await this.authService.generateResetToken(user.id);
    const frontendUrl =
      this.configService.get<string>("FRONTEND_URL") ?? "http://localhost:3000";
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await this.emailService.sendPasswordReset(user.email, resetUrl, user.name);

    return { message: "If this email exists, a reset link has been sent." };
  }

  /** POST /auth/reset-password — validates token and updates password */
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: "Password has been reset successfully." };
  }

  /** POST /auth/register — public client self-registration */
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterClientDto) {
    return this.authService.registerClient(dto);
  }

  /** POST /auth/register-internal — ADMIN only, creates internal staff accounts */
  @Post("register-internal")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  registerInternal(@Body() dto: RegisterInternalDto) {
    return this.authService.registerInternal(dto);
  }
}
