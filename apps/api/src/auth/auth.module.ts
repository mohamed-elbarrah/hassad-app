import { Module, forwardRef } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { AuthService } from "./auth.service";
import { ClientInvitationService } from "./client-invitation.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtRefreshStrategy } from "./strategies/jwt-refresh.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { GoogleOAuthGuard } from "./guards/google-oauth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { EmailService } from "../common/services/email.service";
import { RequestsModule } from "../modules/requests/requests.module";

@Module({
  imports: [
    PassportModule,
    forwardRef(() => RequestsModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("JWT_SECRET"),
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
    ClientInvitationService,
    EmailService,
    JwtStrategy,
    JwtRefreshStrategy,
    GoogleOAuthGuard,
    RolesGuard,
    Reflector,
    ...(process.env.GOOGLE_CLIENT_ID ? [GoogleStrategy] : []),
  ],
  exports: [AuthService, ClientInvitationService, EmailService],
})
export class AuthModule {}
