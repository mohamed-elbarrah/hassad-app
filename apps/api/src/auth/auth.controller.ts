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
import { Throttle } from "@nestjs/throttler"; // NEW
import { ConfigService } from "@nestjs/config";
import {
  AuthService,
  accessTokenLifetimeMs,
  configuredCookieMaxAgeMs,
  refreshTokenLifetimeMs,
} from "./auth.service";
import { LoginDto, UserRole } from "@hassad/shared";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { OptionalJwtAuthGuard } from "./guards/optional-jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import {
  CurrentUser,
  JwtPayload,
} from "../common/decorators/current-user.decorator";
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

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 req/minute
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Request() req: ExpressRequest,
  ) {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip;
    const userAgent = req.headers["user-agent"];

    const { user, accessToken, refreshToken } = await this.authService.login(
      dto,
      ip,
      userAgent,
    );

    const rememberMe = dto.rememberMe === true;

    const refreshMaxAge = refreshTokenLifetimeMs(
      rememberMe,
      configuredCookieMaxAgeMs(
        this.configService.get<string | number>("COOKIE_REFRESH_TOKEN_MAX_AGE"),
        7 * 24 * 60 * 60 * 1000,
      ),
    );

    const tokenMaxAge = accessTokenLifetimeMs(
      rememberMe,
      configuredCookieMaxAgeMs(
        this.configService.get<string | number>("COOKIE_TOKEN_MAX_AGE"),
        60 * 60 * 1000,
      ),
    );

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

  @UseGuards(JwtRefreshGuard)
  @Post("refresh")
  async refresh(
    @Request() req: ExpressRequest & { user: JwtPayload },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, rememberMe } = await this.authService.refresh(
      req.user,
    );

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: accessTokenLifetimeMs(
        rememberMe,
        configuredCookieMaxAgeMs(
          this.configService.get<string | number>("COOKIE_TOKEN_MAX_AGE"),
          60 * 60 * 1000,
        ),
      ),
    });

    return { accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.id);
  }

  /** POST /auth/logout — clears all auth cookies */
  @UseGuards(OptionalJwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request()
    req: ExpressRequest & { user?: JwtPayload & { sessionId?: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.revokeSession(req.user?.sessionId);
    await this.authService.revokeSessionFromRefreshToken(
      req.cookies?.refreshToken,
    );
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
  @Throttle({ default: { limit: 2, ttl: 300000 } }) // 2 req/5 minutes
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
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 req/minute
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

  // ── Google OAuth ───────────────────────────────────────────────────────────

  /** GET /auth/google — initiates Google OAuth flow */
  @Get("google")
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Guard redirects to Google
  }

  /** GET /auth/google/callback — handles Google OAuth callback */
  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(
    @Request() req: ExpressRequest & { user: any },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user;
    const frontendUrl =
      this.configService.get<string>("FRONTEND_URL") ?? "http://localhost:3000";

    if (!this.configService.get<string>("GOOGLE_CLIENT_ID")) {
      return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
    }

    if (!user) {
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip;
    const userAgent = req.headers["user-agent"];
    const { accessToken, refreshToken } =
      await this.authService.issueOAuthTokens(user.id, ip, userAgent);

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: configuredCookieMaxAgeMs(
        this.configService.get<string | number>("COOKIE_TOKEN_MAX_AGE"),
        60 * 60 * 1000,
      ),
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: configuredCookieMaxAgeMs(
        this.configService.get<string | number>("COOKIE_REFRESH_TOKEN_MAX_AGE"),
        7 * 24 * 60 * 60 * 1000,
      ),
    });

    const redirectUrl = user.role === "CLIENT" ? "/portal" : "/admin";
    return res.redirect(`${frontendUrl}${redirectUrl}`);
  }
}
