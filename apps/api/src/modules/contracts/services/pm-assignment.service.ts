import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ProjectStatus } from "@hassad/shared";

/**
 * Result of a PM assignment decision.
 */
export interface PmAssignmentResult {
  pmId: string;
  pmName: string;
  /** How many active/planning projects this PM currently manages. */
  currentLoad: number;
  /** Whether the PM was chosen because they are the client's account manager. */
  isAccountManager: boolean;
  /** Whether this was a fallback choice (no preferred PM found). */
  isFallback: boolean;
}

/**
 * PmAssignmentService — Finds the best available PM for a new project.
 *
 * Assignment strategy:
 * 1. If the client has an accountManager who is an active PM with reasonable
 *    load (≤ min load + 1), prefer them to maintain the relationship.
 * 2. Otherwise, pick the active PM with the fewest ACTIVE/PLANNING projects.
 * 3. On a tie, pick the PM who was least recently assigned a project.
 * 4. If no PMs exist, return null.
 */
@Injectable()
export class PmAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find the best PM to assign a new project to.
   *
   * @param preferredPmIds - IDs of PMs to prefer (e.g. client.accountManager,
   *   contract.createdBy). First element has highest priority.
   * @param clientId - Optional client ID to check for an account manager.
   * @returns The chosen PM, or null if no active PM exists.
   */
  async findBestPm(
    preferredPmIds: string[] = [],
    clientId?: string,
  ): Promise<PmAssignmentResult | null> {
    // ── Step 1: Get all active PMs with their current project counts ────────
    const activePms = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: "PM" },
      },
      select: {
        id: true,
        name: true,
        managedProjects: {
          where: {
            status: { in: [ProjectStatus.ACTIVE, ProjectStatus.PLANNING] },
          },
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    if (activePms.length === 0) {
      return null;
    }

    // ── Step 2: Compute load and last-assigned date for each PM ────────────
    const pmProfiles = activePms.map((pm) => {
      const currentLoad = pm.managedProjects.length;
      // Last assigned = most recent project creation date, or epoch if none
      const lastAssignedAt = pm.managedProjects.length > 0
        ? new Date(
            Math.max(...pm.managedProjects.map((p) => new Date(p.createdAt).getTime())),
          ).toISOString()
        : new Date(0).toISOString();

      return {
        id: pm.id,
        name: pm.name,
        currentLoad,
        lastAssignedAt,
      };
    });

    // ── Step 3: Find the minimum load ──────────────────────────────────────
    const minLoad = Math.min(...pmProfiles.map((p) => p.currentLoad));

    // ── Step 4: Try preferred PMs (account manager or contract creator) ────
    // Prefer them only if their load is within 1 of the minimum.
    if (preferredPmIds.length > 0) {
      // Also check if client has an account manager who is a PM
      let preferredWithClientManager = [...preferredPmIds];

      if (clientId) {
        const client = await this.prisma.client.findUnique({
          where: { id: clientId },
          select: { accountManager: true },
        });
        if (client?.accountManager) {
          // accountManager goes first in priority
          preferredWithClientManager = [
            client.accountManager,
            ...preferredWithClientManager.filter(
              (id) => id !== client.accountManager,
            ),
          ];
        }
      }

      for (const preferredId of preferredWithClientManager) {
        const pm = pmProfiles.find((p) => p.id === preferredId);
        if (pm && pm.currentLoad <= minLoad + 1) {
          const isAccountManager = clientId
            ? await this.isClientAccountManager(pm.id, clientId)
            : false;
          return {
            pmId: pm.id,
            pmName: pm.name,
            currentLoad: pm.currentLoad,
            isAccountManager,
            isFallback: false,
          };
        }
      }
    }

    // ── Step 5: Load-balanced selection — fewest projects, then least recent ─
    const candidates = pmProfiles.filter((p) => p.currentLoad === minLoad);

    // Tiebreaker: least recently assigned
    candidates.sort((a, b) =>
      a.lastAssignedAt.localeCompare(b.lastAssignedAt),
    );

    const chosen = candidates[0];
    const isFallback = preferredPmIds.length === 0;

    return {
      pmId: chosen.id,
      pmName: chosen.name,
      currentLoad: chosen.currentLoad,
      isAccountManager: false,
      isFallback,
    };
  }

  /**
   * Check if a given PM is the account manager for a client.
   */
  private async isClientAccountManager(
    pmId: string,
    clientId: string,
  ): Promise<boolean> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { accountManager: true },
    });
    return client?.accountManager === pmId;
  }
}