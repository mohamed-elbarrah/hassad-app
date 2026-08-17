import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { RequestStatus, UserRole } from "@hassad/shared";

type DbClient = Prisma.TransactionClient | PrismaService;

/**
 * Terminal request statuses — sales work is done on these.
 * Excluded from load calculations.
 */
const TERMINAL_STATUSES: RequestStatus[] = [
  RequestStatus.PROJECT_CREATED,
  RequestStatus.CANCELLED,
];

/**
 * Active request statuses — sales user is still working on the request.
 */
const ACTIVE_STATUSES: RequestStatus[] = Object.values(RequestStatus).filter(
  (status) => !TERMINAL_STATUSES.includes(status),
);

/**
 * Result of a sales assignment decision.
 */
export interface SalesAssignmentResult {
  salesId: string;
  salesName: string;
  /** How many non-terminal requests this sales user currently manages. */
  currentLoad: number;
  /** Whether the sales user was chosen because they are the client's account manager. */
  isAccountManager: boolean;
  /** Whether this was a fallback choice (no preferred sales found). */
  isFallback: boolean;
}

/**
 * SalesAssignmentService — Finds the best available sales user for a new request.
 *
 * Assignment strategy:
 * 1. If the client has an accountManager who is an active SALES user with reasonable
 *    load (≤ min load + 1), prefer them to maintain the relationship.
 * 2. Otherwise, pick the active SALES user with the fewest active requests.
 * 3. On a tie, pick the sales user who was least recently assigned a request.
 * 4. If no SALES users exist, fall back to ADMIN users with the same logic.
 * 5. If no suitable users exist, return null.
 */
@Injectable()
export class SalesAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find the best sales user to assign a new request to.
   *
   * @param preferredSalesIds - IDs of sales users to prefer (e.g. client.accountManager,
   *   request.assignedSalesId). First element has highest priority.
   * @param clientId - Optional client ID to check for an account manager.
   * @param db - Optional Prisma client (transaction or main). Defaults to this.prisma.
   * @returns The chosen sales user, or null if no active user exists.
   */
  async findBestSales(
    preferredSalesIds: string[] = [],
    clientId?: string,
    db?: DbClient,
  ): Promise<SalesAssignmentResult | null> {
    const dbClient = db ?? this.prisma;

    // ── Step 1: Try SALES users ────────────────────────────────────────────
    const salesResult = await this.findBestInRole(
      dbClient,
      UserRole.SALES,
      preferredSalesIds,
      clientId,
    );

    if (salesResult) {
      return salesResult;
    }

    // ── Step 2: Fall back to ADMIN users ───────────────────────────────────
    const adminResult = await this.findBestInRole(
      dbClient,
      UserRole.ADMIN,
      preferredSalesIds,
      clientId,
    );

    if (adminResult) {
      return { ...adminResult, isFallback: true };
    }

    return null;
  }

  /**
   * Core load-balanced selection for a specific role.
   * Private — called by findBestSales for each role tier (SALES → ADMIN).
   */
  private async findBestInRole(
    db: DbClient,
    role: string,
    preferredIds: string[],
    clientId?: string,
  ): Promise<SalesAssignmentResult | null> {
    // Fetch active users in this role with their assigned requests
    const activeUsers = await db.user.findMany({
      where: {
        isActive: true,
        role: { name: role },
      },
      select: {
        id: true,
        name: true,
        assignedRequests: {
          where: {
            status: { in: ACTIVE_STATUSES },
          },
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    if (activeUsers.length === 0) {
      return null;
    }

    // Compute load and last-assigned date for each user
    const profiles = activeUsers.map((user) => {
      const currentLoad = user.assignedRequests.length;
      const lastAssignedAt =
        user.assignedRequests.length > 0
          ? new Date(
              Math.max(
                ...user.assignedRequests.map((r) =>
                  new Date(r.createdAt).getTime(),
                ),
              ),
            ).toISOString()
          : new Date(0).toISOString();

      return {
        id: user.id,
        name: user.name,
        currentLoad,
        lastAssignedAt,
      };
    });

    const minLoad = Math.min(...profiles.map((p) => p.currentLoad));

    // Try preferred users (account manager + explicit preferences)
    if (preferredIds.length > 0 || clientId) {
      let orderedPreferred = [...preferredIds];

      // Client's account manager gets highest priority
      if (clientId) {
        const client = await db.client.findUnique({
          where: { id: clientId },
          select: { accountManager: true },
        });
        if (client?.accountManager) {
          orderedPreferred = [
            client.accountManager,
            ...orderedPreferred.filter((id) => id !== client.accountManager),
          ];
        }
      }

      for (const preferredId of orderedPreferred) {
        const user = profiles.find((p) => p.id === preferredId);
        if (user && user.currentLoad <= minLoad + 1) {
          return {
            salesId: user.id,
            salesName: user.name,
            currentLoad: user.currentLoad,
            isAccountManager: clientId
              ? await this.isClientAccountManager(db, user.id, clientId)
              : false,
            isFallback: false,
          };
        }
      }
    }

    // Load-balanced selection: fewest requests, then least recently assigned
    const candidates = profiles.filter((p) => p.currentLoad === minLoad);
    candidates.sort((a, b) => a.lastAssignedAt.localeCompare(b.lastAssignedAt));

    const chosen = candidates[0];
    const isFallback = preferredIds.length === 0;

    return {
      salesId: chosen.id,
      salesName: chosen.name,
      currentLoad: chosen.currentLoad,
      isAccountManager: false,
      isFallback,
    };
  }

  /**
   * Check if a given user is the account manager for a client.
   */
  private async isClientAccountManager(
    db: DbClient,
    userId: string,
    clientId: string,
  ): Promise<boolean> {
    const client = await db.client.findUnique({
      where: { id: clientId },
      select: { accountManager: true },
    });
    return client?.accountManager === userId;
  }
}
