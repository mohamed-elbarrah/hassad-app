import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>("GOOGLE_CLIENT_ID") ?? "",
      clientSecret: configService.get<string>("GOOGLE_CLIENT_SECRET") ?? "",
      callbackURL:
        configService.get<string>("GOOGLE_CALLBACK_URL") ??
        "http://localhost:3001/v1/auth/google/callback",
      scope: ["email", "profile"],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { emails, name, id } = profile;
    const email = emails?.[0]?.value;
    const firstName = name?.givenName ?? "";
    const lastName = name?.familyName ?? "";
    const fullName =
      `${firstName} ${lastName}`.trim() || email?.split("@")[0] || "User";

    if (!email) {
      return done(new UnauthorizedException("No email from Google"), false);
    }

    try {
      const result = await this.authService.validateOAuthUser({
        email,
        name: fullName,
        provider: "google",
        providerId: id,
      });
      done(null, result);
    } catch (err) {
      done(err as Error, false);
    }
  }
}
