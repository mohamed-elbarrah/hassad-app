import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();

    let token: string | undefined;

    // WebSocket authentication follows the HTTP session cookie standard. Do
    // not accept client-controlled Socket.IO auth/query tokens.
    const cookieHeader = client.handshake?.headers?.cookie || "";
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    if (match) {
      try {
        token = decodeURIComponent(match[1]);
      } catch {
        throw new WsException({
          code: "AUTHENTICATION_INVALID",
          details: {},
        });
      }
    }

    if (!token) {
      throw new WsException({
        code: "AUTHENTICATION_REQUIRED",
        details: {},
      });
    }

    client.data.user = await this.validateToken(token);
    return true;
  }

  /** Validate a JWT and its backing session. */
  async validateToken(
    token: string,
  ): Promise<{ id?: string; sub?: string; sid?: string }> {
    let payload: { id?: string; sub?: string; sid?: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new WsException({ code: "AUTHENTICATION_INVALID", details: {} });
    }

    return this.validateSession(payload);
  }

  /** Match the HTTP permission guard for socket operations that need it. */
  async assertPermission(userId: string, permission: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isActive: true,
        suspendedAt: true,
        suspendedUntil: true,
        role: {
          select: {
            name: true,
            permissions: { select: { permission: { select: { name: true } } } },
          },
        },
        permissions: { select: { permission: { select: { name: true } } } },
      },
    });
    if (!user?.isActive) {
      throw new WsException({ code: "PERMISSION_DENIED", details: {} });
    }
    if (
      user.suspendedAt &&
      (!user.suspendedUntil || user.suspendedUntil > new Date())
    ) {
      throw new WsException({ code: "ACCOUNT_SUSPENDED", details: {} });
    }
    if (user.role?.name === "ADMIN") return;
    const granted = new Set([
      ...(user.role?.permissions ?? []).map(
        ({ permission }) => permission.name,
      ),
      ...user.permissions.map(({ permission }) => permission.name),
    ]);
    if (!granted.has(permission)) {
      throw new WsException({
        code: "PERMISSION_DENIED",
        details: { requiredPermissions: [permission] },
      });
    }
  }

  /** Check a mutable permission without exposing authorization errors to callers
   * that only need to decide whether a socket may receive an event. */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      await this.assertPermission(userId, permission);
      return true;
    } catch {
      return false;
    }
  }

  /** Re-check mutable authentication state for an already established socket. */
  async validateSession(payload: { id?: string; sub?: string; sid?: string }) {
    const userId = payload?.id || payload?.sub;
    if (!userId || !payload.sid) {
      throw new WsException({ code: "INVALID_TOKEN", details: {} });
    }

    const session = await this.prisma.session.findFirst({
      where: { id: payload.sid, userId },
      include: {
        user: {
          select: { isActive: true, suspendedAt: true, suspendedUntil: true },
        },
      },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new WsException({ code: "SESSION_REVOKED", details: {} });
    }
    if (!session.user.isActive) {
      throw new WsException({ code: "ACCOUNT_INACTIVE", details: {} });
    }
    if (
      session.user.suspendedAt &&
      (!session.user.suspendedUntil || session.user.suspendedUntil > new Date())
    ) {
      throw new WsException({ code: "ACCOUNT_SUSPENDED", details: {} });
    }
    return payload;
  }
}
