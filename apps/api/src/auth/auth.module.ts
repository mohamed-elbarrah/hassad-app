import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtRefreshStrategy } from "./strategies/jwt-refresh.strategy";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { OptionalJwtAuthGuard } from "./guards/optional-jwt-auth.guard";
import { GoogleStrategy } from "./strategies/google.strategy";
import { RolesGuard } from "./guards/roles.guard";
import { EmailService } from "../common/services/email.service";
import { RequestsModule } from "../modules/requests/requests.module";
import { ApiException } from "../common/errors/api-error";

@Module({
  imports: [
    PassportModule,
    RequestsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: (() => {
          const secret = configService.get<string>("JWT_SECRET");
          const refreshSecret = configService.get<string>("JWT_REFRESH_SECRET");
          if (!secret) {
            throw new ApiException(
              "AUTH_UNAUTHORIZED",
              "Authentication configuration is not available",
              500,
            );
          }
          if (!refreshSecret) {
            throw new ApiException(
              "AUTH_REFRESH_SECRET_MISSING",
              "Refresh token service is not configured",
              500,
            );
          }
          return secret;
        })(),
        signOptions: {
          expiresIn: (configService.get<string>("JWT_EXPIRES_IN") ||
            "1h") as unknown as number,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailService,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtRefreshGuard,
    GoogleAuthGuard,
    OptionalJwtAuthGuard,
    RolesGuard,
    Reflector,
    GoogleStrategy,
  ],
  exports: [AuthService, EmailService],
})
export class AuthModule {}
