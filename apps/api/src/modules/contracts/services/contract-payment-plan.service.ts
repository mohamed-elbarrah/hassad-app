import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { PaymentPlanTriggerType, PaymentAmountType } from "@hassad/shared";
import { Prisma } from "@prisma/client";
import type { ContractPaymentPlan } from "@prisma/client";
import {
  DefinePaymentPlanDto,
  PaymentPlanRowDto,
} from "../dto/payment-plan.dto";
import {
  contractNotFound,
  contractCommercialTermsImmutable,
  contractPaymentPlanAmountInvalid,
  contractPaymentPlanDownPaymentDuplicate,
  contractPaymentPlanDownPaymentExceedsTotal,
  contractPaymentPlanPercentInvalid,
  contractPaymentPlanRowNotFound,
  contractPaymentPlanSequenceDuplicate,
  contractPaymentPlanSequenceInvalid,
} from "../errors/contract-errors";

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
      where: { contractId, isActive: true },
      orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
    });
  }

  /**
   * Replace a contract's entire payment plan (idempotent define).
   * Existing rows are deactivated and recreated inside one transaction.
   */
  async definePlan(contractId: string, dto: DefinePaymentPlanDto) {
    const rows = this.normalizeSequences(dto.rows);

    await this.prisma.$transaction(async (tx) => {
      const contract = await this.lockContract(tx, contractId);
      await this.validateRows(rows, contract.totalValue);
      await tx.contractPaymentPlan.updateMany({
        where: { contractId, isActive: true },
        data: { isActive: false },
      });
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
    return this.prisma.$transaction(async (tx) => {
      const contract = await this.lockContract(tx, contractId);
      const existingOnSignRows =
        row.triggerType === PaymentPlanTriggerType.ON_SIGN
          ? await tx.contractPaymentPlan.count({
              where: {
                contractId,
                triggerType: PaymentPlanTriggerType.ON_SIGN,
                isActive: true,
              },
            })
          : 0;
      await this.validateRows([row], contract.totalValue, existingOnSignRows);

      const sequence = await this.resolveSequence(tx, contractId, row.sequence);
      return tx.contractPaymentPlan.create({
        data: {
          contractId,
          label: row.label,
          sequence,
          triggerType: row.triggerType,
          amountType: row.amountType,
          amountValue: row.amountValue,
          isRecurring: row.isRecurring ?? false,
          dueOffsetDays: row.dueOffsetDays ?? 0,
          isActive: true,
        },
      });
    });
  }

  /** Update a single plan row. */
  async updateRow(contractId: string, rowId: string, row: PaymentPlanRowDto) {
    return this.prisma.$transaction(async (tx) => {
      const contract = await this.lockContract(tx, contractId);
      const existing = await tx.contractPaymentPlan.findFirst({
        where: { id: rowId, contractId, isActive: true },
      });
      if (!existing) throw contractPaymentPlanRowNotFound();
      const existingOnSignRows =
        row.triggerType === PaymentPlanTriggerType.ON_SIGN
          ? await tx.contractPaymentPlan.count({
              where: {
                contractId: existing.contractId,
                triggerType: PaymentPlanTriggerType.ON_SIGN,
                id: { not: rowId },
                isActive: true,
              },
            })
          : 0;
      await this.validateRows([row], contract.totalValue, existingOnSignRows);
      const sequence = await this.resolveSequence(
        tx,
        existing.contractId,
        row.sequence ?? existing.sequence,
        rowId,
      );

      const updated = await tx.contractPaymentPlan.updateMany({
        where: { id: rowId, contractId, isActive: true },
        data: {
          label: row.label,
          sequence,
          triggerType: row.triggerType,
          amountType: row.amountType,
          amountValue: row.amountValue,
          isRecurring: row.isRecurring ?? existing.isRecurring,
          dueOffsetDays: row.dueOffsetDays ?? existing.dueOffsetDays ?? 0,
        },
      });
      if (updated.count === 0) throw contractPaymentPlanRowNotFound();
      return tx.contractPaymentPlan.findUnique({ where: { id: rowId } });
    });
  }

  /** Deactivate a single plan row to preserve invoice references and history. */
  async removeRow(contractId: string, rowId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockContract(tx, contractId);
      const existing = await tx.contractPaymentPlan.findFirst({
        where: { id: rowId, contractId, isActive: true },
      });
      if (!existing) throw contractPaymentPlanRowNotFound();
      const removed = await tx.contractPaymentPlan.updateMany({
        where: { id: rowId, contractId, isActive: true },
        data: { isActive: false },
      });
      if (removed.count === 0) throw contractPaymentPlanRowNotFound();
      return tx.contractPaymentPlan.findUnique({ where: { id: rowId } });
    });
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
      where: {
        contractId,
        triggerType: PaymentPlanTriggerType.ON_SIGN,
        isActive: true,
      },
      orderBy: { sequence: "asc" },
    });
  }

  private async assertContractExists(contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true, totalValue: true, status: true },
    });
    if (!contract) throw contractNotFound();
    return contract;
  }

  /** Serialize all plan mutations for a contract at the database level. */
  private async lockContract(tx: any, contractId: string) {
    if (typeof tx.$queryRaw === "function") {
      await tx.$queryRaw(
        Prisma.sql`SELECT id FROM contracts WHERE id = ${contractId} FOR UPDATE`,
      );
    }
    const contract = tx.contract?.findUnique
      ? await tx.contract.findUnique({
          where: { id: contractId },
          select: { id: true, totalValue: true, status: true },
        })
      : await this.prisma.contract.findUnique({
          where: { id: contractId },
          select: { id: true, totalValue: true, status: true },
        });
    if (!contract) throw contractNotFound();
    await this.assertCommercialTermsMutable(tx, contract);
    return contract;
  }

  private async assertCommercialTermsMutable(
    tx: any,
    contract: { id: string; status: string },
  ) {
    if (
      contract.status &&
      contract.status !== "DRAFT" &&
      contract.status !== "SENT"
    ) {
      throw contractCommercialTermsImmutable({
        contractId: contract.id,
        currentStatus: contract.status,
      });
    }

    const invoice = tx.invoice?.findFirst
      ? await tx.invoice.findFirst({
          where: { contractId: contract.id },
          select: { id: true },
        })
      : null;
    if (invoice) {
      throw contractCommercialTermsImmutable({
        contractId: contract.id,
        invoiceId: invoice.id,
      });
    }
  }

  async validateRows(
    rows: PaymentPlanRowDto[],
    totalValue: number,
    existingOnSignRows = 0,
  ) {
    const onSignRows = rows.filter(
      (r) => r.triggerType === PaymentPlanTriggerType.ON_SIGN,
    );
    if (onSignRows.length + existingOnSignRows > 1) {
      throw contractPaymentPlanDownPaymentDuplicate({
        field: "triggerType",
        triggerType: PaymentPlanTriggerType.ON_SIGN,
        maximum: 1,
      });
    }

    const sequences = new Map<number, number[]>();
    rows.forEach((row, index) => {
      if (row.sequence === undefined || row.sequence === null) return;
      const indexes = sequences.get(row.sequence) ?? [];
      indexes.push(index);
      sequences.set(row.sequence, indexes);
    });
    for (const [sequence, rowIndexes] of sequences) {
      if (rowIndexes.length > 1) {
        throw contractPaymentPlanSequenceDuplicate({
          field: "sequence",
          sequence,
          rowIndexes,
        });
      }
    }

    // Count ON_SIGN rows already in DB when adding/updating a single row.
    // (For definePlan we delete first, so only the dto rows matter.)
    for (const r of rows) {
      if (
        r.sequence !== undefined &&
        r.sequence !== null &&
        (!Number.isInteger(r.sequence) || r.sequence < 0)
      ) {
        throw contractPaymentPlanSequenceInvalid({
          field: "sequence",
          integer: true,
          value: r.sequence,
        });
      }
      if (!Number.isFinite(r.amountValue)) {
        throw contractPaymentPlanAmountInvalid({
          field: "amountValue",
          value: r.amountValue,
        });
      }
      if (r.amountType === PaymentAmountType.PERCENT) {
        if (r.amountValue < 0 || r.amountValue > 100) {
          throw contractPaymentPlanPercentInvalid({
            field: "amountValue",
            amountType: PaymentAmountType.PERCENT,
            minimum: 0,
            maximum: 100,
            value: r.amountValue,
          });
        }
      } else {
        if (r.amountValue < 0) {
          throw contractPaymentPlanAmountInvalid({
            field: "amountValue",
            amountType: PaymentAmountType.FIXED,
            minimum: 0,
            value: r.amountValue,
          });
        }
      }

      // A fixed down payment larger than the contract total makes no sense.
      if (
        r.triggerType === PaymentPlanTriggerType.ON_SIGN &&
        r.amountType === PaymentAmountType.FIXED &&
        r.amountValue > totalValue
      ) {
        throw contractPaymentPlanDownPaymentExceedsTotal({
          field: "amountValue",
          amountType: PaymentAmountType.FIXED,
          triggerType: PaymentPlanTriggerType.ON_SIGN,
          value: r.amountValue,
          totalValue,
        });
      }
    }
  }

  normalizeSequences(rows: PaymentPlanRowDto[]) {
    const used = new Set(
      rows
        .map((row) => row.sequence)
        .filter((sequence): sequence is number => sequence != null),
    );
    let nextSequence = 0;

    return rows.map((row) => {
      if (row.sequence != null) return row;
      while (used.has(nextSequence)) nextSequence += 1;
      const sequence = nextSequence;
      used.add(sequence);
      nextSequence += 1;
      return { ...row, sequence };
    });
  }

  private async resolveSequence(
    tx: any,
    contractId: string,
    sequence?: number | null,
    excludeRowId?: string,
  ) {
    if (sequence === undefined || sequence === null) {
      const maxSequence = await tx.contractPaymentPlan.aggregate({
        where: { contractId, isActive: true },
        _max: { sequence: true },
      });
      return (maxSequence._max.sequence ?? -1) + 1;
    }

    const existing = await tx.contractPaymentPlan.findFirst({
      where: {
        contractId,
        sequence,
        isActive: true,
        ...(excludeRowId ? { id: { not: excludeRowId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw contractPaymentPlanSequenceDuplicate({
        field: "sequence",
        sequence,
        existingRowId: existing.id,
      });
    }

    return sequence;
  }
}
