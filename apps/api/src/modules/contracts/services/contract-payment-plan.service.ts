import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { PaymentPlanTriggerType, PaymentAmountType } from "@hassad/shared";
import type { ContractPaymentPlan } from "@prisma/client";
import {
  DefinePaymentPlanDto,
  PaymentPlanRowDto,
} from "../dto/payment-plan.dto";

/**
 * ContractPaymentPlanService
 *
 * Owns the commercial payment plan for a contract: the ordered list of planned
 * payments (down payment, recurring monthly, milestones) that drive invoice
 * generation. This is the "schedule" side of Option B1.
 *
 * Rules:
 *  - At most ONE `ON_SIGN` row (the down payment). 0 or 1.
 *  - `PERCENT` amounts must be within 0-100.
 *  - `FIXED` down payment must not exceed the contract `totalValue`.
 *  - `sequence` is unique within a plan and is auto-assigned when omitted.
 */
@Injectable()
export class ContractPaymentPlanService {
  constructor(private prisma: PrismaService) {}

  /** List the plan rows for a contract, ordered by sequence. */
  async getPlan(contractId: string): Promise<ContractPaymentPlan[]> {
    await this.assertContractExists(contractId);
    return this.prisma.contractPaymentPlan.findMany({
      where: { contractId },
      orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
    });
  }

  /**
   * Replace a contract's entire payment plan (idempotent define).
   * Existing rows are deleted and recreated inside one transaction.
   */
  async definePlan(contractId: string, dto: DefinePaymentPlanDto) {
    const contract = await this.assertContractExists(contractId);
    await this.validateRows(dto.rows, contract.totalValue);

    const rows = this.normalizeSequences(dto.rows);

    await this.prisma.$transaction(async (tx) => {
      await tx.contractPaymentPlan.deleteMany({ where: { contractId } });
      await tx.contractPaymentPlan.createMany({
        data: rows.map((r) => ({
          contractId,
          label: r.label,
          sequence: r.sequence ?? 0,
          triggerType: r.triggerType,
          amountType: r.amountType,
          amountValue: r.amountValue,
          isRecurring: r.isRecurring ?? false,
          dueOffsetDays: r.dueOffsetDays ?? 0,
          isActive: true,
        })),
      });
    });

    return this.getPlan(contractId);
  }

  /** Append a single row to an existing plan. */
  async addRow(contractId: string, row: PaymentPlanRowDto) {
    const contract = await this.assertContractExists(contractId);
    await this.validateRows([row], contract.totalValue);

    const maxSeq = await this.prisma.contractPaymentPlan.aggregate({
      where: { contractId },
      _max: { sequence: true },
    });
    const nextSeq = (maxSeq._max.sequence ?? -1) + 1;

    return this.prisma.contractPaymentPlan.create({
      data: {
        contractId,
        label: row.label,
        sequence: row.sequence ?? nextSeq,
        triggerType: row.triggerType,
        amountType: row.amountType,
        amountValue: row.amountValue,
        isRecurring: row.isRecurring ?? false,
        dueOffsetDays: row.dueOffsetDays ?? 0,
      },
    });
  }

  /** Update a single plan row. */
  async updateRow(rowId: string, row: PaymentPlanRowDto) {
    const existing = await this.prisma.contractPaymentPlan.findUnique({
      where: { id: rowId },
      include: { contract: { select: { totalValue: true } } },
    });
    if (!existing) throw new NotFoundException("Plan row not found");

    await this.validateRows([row], existing.contract.totalValue);

    return this.prisma.contractPaymentPlan.update({
      where: { id: rowId },
      data: {
        label: row.label,
        sequence: row.sequence ?? existing.sequence,
        triggerType: row.triggerType,
        amountType: row.amountType,
        amountValue: row.amountValue,
        isRecurring: row.isRecurring ?? existing.isRecurring,
        dueOffsetDays: row.dueOffsetDays ?? existing.dueOffsetDays ?? 0,
      },
    });
  }

  /** Remove a single plan row (soft: sets isActive=false to preserve history links). */
  async removeRow(rowId: string) {
    const existing = await this.prisma.contractPaymentPlan.findUnique({
      where: { id: rowId },
    });
    if (!existing) throw new NotFoundException("Plan row not found");
    // Hard delete is safe here: invoices reference it via SET NULL, so history is kept.
    return this.prisma.contractPaymentPlan.delete({ where: { id: rowId } });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Resolve a plan row to a concrete SAR amount given the contract total. */
  resolveAmount(
    row: { amountType: "PERCENT" | "FIXED"; amountValue: number },
    totalValue: number,
  ): number {
    if (row.amountType === "PERCENT") {
      return Math.round(totalValue * (row.amountValue / 100) * 100) / 100;
    }
    return row.amountValue;
  }

  /** Return the ON_SIGN (down payment) plan row, or null if none. */
  async getOnSignRow(contractId: string): Promise<ContractPaymentPlan | null> {
    return this.prisma.contractPaymentPlan.findFirst({
      where: { contractId, triggerType: PaymentPlanTriggerType.ON_SIGN },
      orderBy: { sequence: "asc" },
    });
  }

  private async assertContractExists(contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true, totalValue: true, status: true },
    });
    if (!contract) throw new NotFoundException("Contract not found");
    return contract;
  }

  private async validateRows(rows: PaymentPlanRowDto[], totalValue: number) {
    const onSignRows = rows.filter(
      (r) => r.triggerType === PaymentPlanTriggerType.ON_SIGN,
    );
    if (onSignRows.length > 1) {
      throw new BadRequestException(
        "A contract may have at most one ON_SIGN (down payment) plan row.",
      );
    }

    // Count ON_SIGN rows already in DB when adding/updating a single row.
    // (For definePlan we delete first, so only the dto rows matter.)
    for (const r of rows) {
      if (r.amountType === PaymentAmountType.PERCENT) {
        if (r.amountValue < 0 || r.amountValue > 100) {
          throw new BadRequestException(
            `Plan row "${r.label}": PERCENT amount must be between 0 and 100.`,
          );
        }
      } else {
        if (r.amountValue < 0) {
          throw new BadRequestException(
            `Plan row "${r.label}": FIXED amount must be zero or greater.`,
          );
        }
      }

      // A fixed down payment larger than the contract total makes no sense.
      if (
        r.triggerType === PaymentPlanTriggerType.ON_SIGN &&
        r.amountType === PaymentAmountType.FIXED &&
        r.amountValue > totalValue
      ) {
        throw new BadRequestException(
          `Down payment (${r.amountValue}) cannot exceed contract total value (${totalValue}).`,
        );
      }
    }
  }

  private normalizeSequences(rows: PaymentPlanRowDto[]) {
    // If any sequence is missing, auto-assign 0..n; otherwise keep provided order.
    const needsAuto = rows.some(
      (r) => r.sequence === undefined || r.sequence === null,
    );
    if (!needsAuto) return rows;
    return rows.map((r, i) => ({ ...r, sequence: r.sequence ?? i }));
  }
}
