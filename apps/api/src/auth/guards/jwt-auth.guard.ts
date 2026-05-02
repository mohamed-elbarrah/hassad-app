import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  handleRequest<TUser>(err: unknown, user: TUser | false | null): TUser {
    if (err || !user) {
      throw (
        (err as Error) ||
        new UnauthorizedException("Authentication token is missing or invalid")
      );
    }
    return user;
  }
}
