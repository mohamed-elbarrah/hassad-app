import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes } from "crypto";
import * as bcrypt from "bcrypt";
import { ClientStatus } from "@hassad/shared";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

export interface CreateClientInvitationParams {
  createdById: string;
  userId: string;
  clientId: string;
  requestId?: string;
  expiresInHours?: number;
}

@Injectable()
export class ClientInvitationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /** Creates a setup invitation and returns the raw setup URL once. */
  async createInvitation(
    params: CreateClientInvitationParams,
    tx?: Prisma.TransactionClient,
  ) {
    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + (params.expiresInHours ?? 72) * 60 * 60 * 1000,
    );

    const create = async (tx: Prisma.TransactionClient) => {
      // Serialize issuances for this target so concurrent requests cannot both
      // leave an active invitation behind.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${params.userId}:${params.clientId}`}))`;
      const [creator, user, client] = await Promise.all([
        tx.user.findUnique({
          where: { id: params.createdById },
          select: { id: true },
        }),
        tx.user.findUnique({
          where: { id: params.userId },
          select: {
            id: true,
            role: { select: { name: true } },
            passwordHash: true,
            passwordSetAt: true,
          },
        }),
        tx.client.findUnique({
          where: { id: params.clientId },
          select: { id: true, userId: true },
        }),
      ]);
      if (!creator)
        throw new NotFoundException({
          code: "INVITATION_CREATOR_NOT_FOUND",
          details: {},
        });
      if (!user)
        throw new NotFoundException({
          code: "INVITATION_USER_NOT_FOUND",
          details: {},
        });
      if (user.role.name !== "CLIENT") {
        throw new NotFoundException({
          code: "INVITATION_USER_NOT_FOUND",
          details: {},
        });
      }
      if (user.passwordHash || user.passwordSetAt) {
        throw new UnauthorizedException({
          code: "CLIENT_PASSWORD_ALREADY_SET",
          details: {},
        });
      }
      if (!client || client.userId !== user.id) {
        throw new NotFoundException({
          code: "INVITATION_CLIENT_NOT_FOUND",
          details: {},
        });
      }
      if (params.requestId) {
        const request = await tx.request.findUnique({
          where: { id: params.requestId },
          select: { id: true, clientId: true },
        });
        if (!request || request.clientId !== client.id) {
          throw new NotFoundException({
            code: "INVITATION_REQUEST_NOT_FOUND",
            details: {},
          });
        }
      }

      // A new invitation invalidates all outstanding invitations for this target.
      await tx.clientInvitation.updateMany({
        where: {
          userId: user.id,
          clientId: client.id,
          consumedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
      return tx.clientInvitation.create({
        data: {
          tokenHash,
          expiresAt,
          createdById: creator.id,
          userId: user.id,
          clientId: client.id,
          requestId: params.requestId,
        },
      });
    };
    const invitation = tx
      ? await create(tx)
      : await this.prisma.$transaction(create);

    const frontendUrl =
      this.configService.get<string>("FRONTEND_URL") ??
      "http://localhost:3000";
    return {
      invitationId: invitation.id,
      setupUrl: `${frontendUrl}/setup-password?token=${encodeURIComponent(rawToken)}`,
      expiresAt: invitation.expiresAt,
    };
  }

  /** Revokes all outstanding invitations for a client user. */
  async revokeInvitations(userId: string, clientId: string): Promise<number> {
    const result = await this.prisma.clientInvitation.updateMany({
      where: { userId, clientId, consumedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  /** Atomically consumes an invitation and sets the initial password. */
  async acceptInvitation(token: string, password: string) {
    const tokenHash = this.hashToken(token);
    const now = new Date();
    const invitation = await this.prisma.clientInvitation.findFirst({
      where: {
        tokenHash,
        consumedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      select: { id: true, userId: true },
    });
    if (!invitation) {
      throw new UnauthorizedException({
        code: "INVALID_CLIENT_INVITATION",
        details: {},
      });
    }
    const passwordHash = await bcrypt.hash(password, 12);

    await this.prisma.$transaction(async (tx) => {
      const transactionNow = new Date();
      const currentUser = await tx.user.findUnique({
        where: { id: invitation.userId },
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: true,
          passwordSetAt: true,
          isActive: true,
          suspendedAt: true,
          suspendedUntil: true,
          role: true,
          clientProfile: { select: { status: true } },
        },
      });
      if (
        !currentUser ||
        currentUser.role.name !== "CLIENT" ||
        currentUser.passwordHash ||
        currentUser.passwordSetAt ||
        !currentUser.isActive ||
        currentUser.clientProfile?.status === ClientStatus.SUSPENDED ||
        (currentUser.suspendedAt &&
          (!currentUser.suspendedUntil ||
            currentUser.suspendedUntil > transactionNow))
      ) {
        // Do not disclose whether the token was valid or which account state
        // prevented acceptance. Invitation acceptance is intentionally opaque.
        throw new UnauthorizedException({
          code: "INVALID_CLIENT_INVITATION",
          details: {},
        });
      }

      const consumed = await tx.clientInvitation.updateMany({
        where: {
          id: invitation.id,
          tokenHash,
          consumedAt: null,
          revokedAt: null,
          expiresAt: { gt: transactionNow },
        },
        data: { consumedAt: transactionNow },
      });
      if (consumed.count !== 1) {
        throw new UnauthorizedException({
          code: "INVALID_CLIENT_INVITATION",
          details: {},
        });
      }

      const updatedUser = await tx.user.update({
        where: { id: invitation.userId },
        data: {
          passwordHash,
          passwordSetAt: transactionNow,
          // An invitation establishes the initial password; invalidate any
          // reset credential so it cannot be used for a second password change.
          resetToken: null,
          resetTokenExpiresAt: null,
        },
        include: { role: true },
      });
      await tx.session.updateMany({
        where: { userId: updatedUser.id, revokedAt: null },
        data: { revokedAt: transactionNow },
      });
      await tx.securityEvent.create({
        data: {
          userId: updatedUser.id,
          type: "PASSWORD_RESET",
          metadata: { source: "CLIENT_INVITATION" },
        },
      });
      return updatedUser;
    });

    return { code: "CLIENT_INVITATION_ACCEPTED" };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token, "utf8").digest("hex");
  }
}
