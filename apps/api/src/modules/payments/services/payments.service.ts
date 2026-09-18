import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  OnModuleInit,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { ClientCounterService } from "../../crm/services/client-counter.service";
import {
  PaymentStatus,
  PaymentGatewayType,
  PaymentMethod,
  PaymentEventType,
  InvoiceStatus,
} from "@hassad/shared";
import { StripeProvider } from "../providers/stripe.provider";
import { BankTransferProvider } from "../providers/bank-transfer.provider";
import { PaymentProvider } from "../providers/payment-provider.interface";
import { UpdateGatewayDto } from "../dto/update-gateway.dto";
import { StorageService } from "../../../common/storage/storage.service";
import * as crypto from "crypto";

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly ALGORITHM = "aes-256-cbc";
  private readonly ENCRYPTION_KEY: string;
  private readonly IV_LENGTH = 16;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private clientCounterService: ClientCounterService,
    private eventEmitter: EventEmitter2,
    private storageService: StorageService,
  ) {
    const key = process.env.PAYMENT_ENCRYPTION_KEY;
    if (!key) {
      throw new Error(
        "PAYMENT_ENCRYPTION_KEY environment variable is required. " +
          "Generate a random 32-character key: openssl rand -base64 32",
      );
    }
    this.ENCRYPTION_KEY = key;
  }

  onModuleInit() {
    if (this.ENCRYPTION_KEY.length < 32) {
      console.warn(
        "PAYMENT_ENCRYPTION_KEY is shorter than 32 characters. " +
          "Consider using a longer key for AES-256-CBC.",
      );
    }
  }

  private validatePaymentAmount(
    invoiceAmount: number,
    payments: Array<{ amount: number; status: string }>,
    requestedAmount: number,
  ) {
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      throw new BadRequestException({
        code: "PAYMENT_AMOUNT_INVALID",
        details: {},
      });
    }
    const paidAmount = payments
      .filter((payment) => payment.status === PaymentStatus.SUCCESS)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const pendingAmount = payments
      .filter((payment) => payment.status === PaymentStatus.PENDING)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = Math.max(
      0,
      invoiceAmount - paidAmount - pendingAmount,
    );
    if (remainingAmount <= 0 || requestedAmount > remainingAmount) {
      throw new BadRequestException({
        code: "PAYMENT_AMOUNT_EXCEEDS_REMAINING",
        details: { remainingAmount },
      });
    }
  }

  private async persistCreatedPayment(params: {
    invoiceId: string;
    clientId: string;
    gatewayId: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    status: PaymentStatus;
    providerPaymentId: string;
    metadata?: unknown;
  }) {
    return this.prisma.$transaction(
      async (tx) => {
        const invoice = await tx.invoice.findUnique({
          where: { id: params.invoiceId },
          include: { payments: { select: { amount: true, status: true } } },
        });
        if (!invoice || invoice.status === InvoiceStatus.CANCELLED) {
          throw new BadRequestException({
            code: "INVOICE_NOT_PAYABLE",
            details: {},
          });
        }
        this.validatePaymentAmount(
          invoice.amount,
          invoice.payments,
          params.amount,
        );

        const payment = await tx.payment.create({
          data: {
            invoiceId: params.invoiceId,
            clientId: params.clientId,
            gatewayId: params.gatewayId,
            amount: params.amount,
            currency: params.currency,
            status: params.status,
            method: params.method,
            providerPaymentId: params.providerPaymentId,
            metadataJson: params.metadata as any,
          },
        });
        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            type: PaymentEventType.CREATED,
            payloadJson: { status: params.status },
          },
        });
        return payment;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(
      this.ALGORITHM,
      Buffer.from(this.ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
      iv,
    );
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }

  private decrypt(text: string): string {
    try {
      const textParts = text.split(":");
      const iv = Buffer.from(textParts.shift()!, "hex");
      const encryptedText = Buffer.from(textParts.join(":"), "hex");
      const decipher = crypto.createDecipheriv(
        this.ALGORITHM,
        Buffer.from(this.ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
        iv,
      );
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } catch (e) {
      return text; // Return as is if not encrypted or decryption fails
    }
  }

  async getProvider(gatewayName: string): Promise<PaymentProvider> {
    const gateway = await this.prisma.paymentGateway.findUnique({
      where: { name: gatewayName },
    });

    if (!gateway || !gateway.isActive) {
      throw new BadRequestException({
        code: "PAYMENT_GATEWAY_UNAVAILABLE",
        details: { gateway: gatewayName },
      });
    }

    let config: any = gateway.configJson;
    if (typeof config === "string") {
      config = JSON.parse(this.decrypt(config));
    }

    switch (gatewayName) {
      case "stripe":
        return new StripeProvider({
          secretKey: config.secretKey,
          webhookSecret: config.webhookSecret,
        });
      case "bank_transfer":
        return new BankTransferProvider();
      default:
        throw new BadRequestException({
          code: "PAYMENT_GATEWAY_UNSUPPORTED",
          details: { gateway: gatewayName },
        });
    }
  }

  async createElementPayment(dto: {
    invoiceId: string;
    amount: number;
    currency?: string;
    clientUserId?: string;
  }) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: {
        payments: { select: { amount: true, status: true } },
        client: { select: { userId: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException({ code: "INVOICE_NOT_FOUND", details: {} });
    }
    if (dto.clientUserId && invoice.client.userId !== dto.clientUserId) {
      throw new BadRequestException({
        code: "INVOICE_ACCESS_FORBIDDEN",
        details: {},
      });
    }
    const currency = (dto.currency ?? invoice.currency).toUpperCase();
    if (currency !== invoice.currency.toUpperCase()) {
      throw new BadRequestException({
        code: "PAYMENT_CURRENCY_MISMATCH",
        details: { expectedCurrency: invoice.currency },
      });
    }
    this.validatePaymentAmount(invoice.amount, invoice.payments, dto.amount);

    const provider = await this.getProvider("stripe");
    const gateway = await this.prisma.paymentGateway.findUnique({
      where: { name: "stripe" },
    });
    if (!gateway) {
      throw new BadRequestException({
        code: "PAYMENT_GATEWAY_NOT_CONFIGURED",
        details: { gateway: "stripe" },
      });
    }

    if (!provider.createElementPaymentIntent) {
      throw new BadRequestException({
        code: "PAYMENT_ELEMENT_NOT_SUPPORTED",
        details: { gateway: "stripe" },
      });
    }

    const intent = await provider.createElementPaymentIntent({
      invoiceId: invoice.id,
      amount: dto.amount,
      currency,
      clientId: invoice.clientId,
    });

    const payment = await this.persistCreatedPayment({
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      gatewayId: gateway.id,
      amount: dto.amount,
      currency,
      status: intent.status,
      method: PaymentMethod.CARD,
      providerPaymentId: intent.providerPaymentId,
      metadata: intent.metadata,
    });

    return {
      ...payment,
      clientSecret: intent.clientSecret,
    };
  }

  async createPayment(dto: {
    invoiceId: string;
    gatewayName: string;
    amount: number;
    currency?: string;
    successUrl?: string;
    cancelUrl?: string;
    clientUserId?: string;
  }) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: {
        payments: { select: { amount: true, status: true } },
        client: { select: { userId: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException({ code: "INVOICE_NOT_FOUND", details: {} });
    }
    if (dto.clientUserId && invoice.client.userId !== dto.clientUserId) {
      throw new BadRequestException({
        code: "INVOICE_ACCESS_FORBIDDEN",
        details: {},
      });
    }
    const currency = (dto.currency ?? invoice.currency).toUpperCase();
    if (currency !== invoice.currency.toUpperCase()) {
      throw new BadRequestException({
        code: "PAYMENT_CURRENCY_MISMATCH",
        details: { expectedCurrency: invoice.currency },
      });
    }
    this.validatePaymentAmount(invoice.amount, invoice.payments, dto.amount);

    const provider = await this.getProvider(dto.gatewayName);
    const gateway = await this.prisma.paymentGateway.findUnique({
      where: { name: dto.gatewayName },
    });
    if (!gateway) {
      throw new BadRequestException({
        code: "PAYMENT_GATEWAY_NOT_CONFIGURED",
        details: { gateway: dto.gatewayName },
      });
    }

    const intent = await provider.createPaymentIntent({
      invoiceId: invoice.id,
      amount: dto.amount,
      currency,
      clientId: invoice.clientId,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    });

    const payment = await this.persistCreatedPayment({
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      gatewayId: gateway.id,
      amount: dto.amount,
      currency,
      status: intent.status,
      method:
        dto.gatewayName === "stripe"
          ? PaymentMethod.CARD
          : PaymentMethod.BANK_TRANSFER,
      providerPaymentId: intent.providerPaymentId,
      metadata: intent.metadata,
    });

    return {
      ...payment,
      clientSecret: intent.clientSecret,
    };
  }

  async createBankTransferSubmission(
    invoiceId: string,
    clientUserId: string,
    notes?: string,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, client: { userId: clientUserId } },
      include: { payments: true },
    });

    if (!invoice) {
      throw new NotFoundException({
        code: "INVOICE_NOT_FOUND",
        details: {},
      });
    }

    const paidAmount = invoice.payments
      .filter((payment) => payment.status === PaymentStatus.SUCCESS)
      .reduce((sum, payment) => sum + payment.amount, 0);

    const existingPending = invoice.payments.find(
      (payment) =>
        payment.method === PaymentMethod.BANK_TRANSFER &&
        payment.status === PaymentStatus.PENDING,
    );
    if (existingPending) return existingPending;

    const pendingAmount = invoice.payments
      .filter((payment) => payment.status === PaymentStatus.PENDING)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = Math.max(
      0,
      invoice.amount - paidAmount - pendingAmount,
    );

    if (remainingAmount <= 0) {
      if (pendingAmount > 0) {
        throw new BadRequestException({
          code: "PAYMENT_PENDING_REVIEW",
          details: { pendingAmount },
        });
      }
      throw new BadRequestException({
        code: "INVOICE_ALREADY_PAID",
        details: {},
      });
    }

    const gateway = await this.prisma.paymentGateway.findUnique({
      where: { name: "bank_transfer" },
    });
    if (!gateway?.isActive) {
      throw new BadRequestException({
        code: "BANK_TRANSFER_UNAVAILABLE",
        details: {},
      });
    }

    let payment;
    try {
      payment = await this.prisma.$transaction(
        async (tx) => {
          const currentInvoice = await tx.invoice.findUnique({
            where: { id: invoice.id },
            include: { payments: true, client: { select: { userId: true } } },
          });
          if (
            !currentInvoice ||
            currentInvoice.client.userId !== clientUserId
          ) {
            throw new NotFoundException({
              code: "INVOICE_NOT_FOUND",
              details: {},
            });
          }
          if (currentInvoice.status === InvoiceStatus.CANCELLED) {
            throw new BadRequestException({
              code: "INVOICE_NOT_PAYABLE",
              details: { status: currentInvoice.status },
            });
          }

          const currentPendingBank = currentInvoice.payments.find(
            (item) =>
              item.method === PaymentMethod.BANK_TRANSFER &&
              item.status === PaymentStatus.PENDING,
          );
          if (currentPendingBank) return currentPendingBank;

          const currentPaidAmount = currentInvoice.payments
            .filter((item) => item.status === PaymentStatus.SUCCESS)
            .reduce((sum, item) => sum + item.amount, 0);
          const currentPendingAmount = currentInvoice.payments
            .filter((item) => item.status === PaymentStatus.PENDING)
            .reduce((sum, item) => sum + item.amount, 0);
          const currentRemainingAmount = Math.max(
            0,
            currentInvoice.amount - currentPaidAmount - currentPendingAmount,
          );
          if (currentRemainingAmount <= 0) {
            throw new BadRequestException({
              code:
                currentPendingAmount > 0
                  ? "PAYMENT_PENDING_REVIEW"
                  : "INVOICE_ALREADY_PAID",
              details: { pendingAmount: currentPendingAmount },
            });
          }

          const created = await tx.payment.create({
            data: {
              invoiceId: currentInvoice.id,
              clientId: currentInvoice.clientId,
              gatewayId: gateway.id,
              amount: currentRemainingAmount,
              currency: currentInvoice.currency,
              method: PaymentMethod.BANK_TRANSFER,
              status: PaymentStatus.PENDING,
              notes,
              metadataJson: { source: "PORTAL_BANK_TRANSFER" },
            },
          });
          await tx.paymentEvent.create({
            data: {
              paymentId: created.id,
              type: PaymentEventType.CREATED,
              payloadJson: {
                status: PaymentStatus.PENDING,
                source: "PORTAL_BANK_TRANSFER",
              },
            },
          });
          return created;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const concurrentPayment = await this.prisma.payment.findFirst({
          where: {
            invoiceId: invoice.id,
            method: PaymentMethod.BANK_TRANSFER,
            status: PaymentStatus.PENDING,
          },
        });
        if (concurrentPayment) return concurrentPayment;
      }
      throw error;
    }

    return payment;
  }

  async reviewBankTransfer(
    paymentId: string,
    reviewerId: string,
    decision: "APPROVE" | "REJECT",
    reason?: string,
  ) {
    if (decision === "REJECT" && !reason?.trim()) {
      throw new BadRequestException({
        code: "REJECTION_REASON_REQUIRED",
        details: {},
      });
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          select: {
            id: true,
            amount: true,
            clientId: true,
            contractId: true,
            paymentPlanId: true,
            createdBy: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException({ code: "PAYMENT_NOT_FOUND", details: {} });
    }
    if (payment.method !== PaymentMethod.BANK_TRANSFER) {
      throw new BadRequestException({
        code: "PAYMENT_REVIEW_NOT_SUPPORTED",
        details: { method: payment.method },
      });
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException({
        code: "PAYMENT_ALREADY_REVIEWED",
        details: { status: payment.status },
      });
    }
    if (payment.invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException({
        code: "INVOICE_NOT_PAYABLE",
        details: { status: payment.invoice.status },
      });
    }
    const nextStatus =
      decision === "APPROVE" ? PaymentStatus.SUCCESS : PaymentStatus.REJECTED;
    let updatedPayment;
    try {
      updatedPayment = await this.prisma.$transaction(
        async (tx) => {
          const currentPayment = await tx.payment.findUnique({
            where: { id: paymentId },
            select: { status: true, receiptImage: true },
          });
          if (
            !currentPayment ||
            currentPayment.status !== PaymentStatus.PENDING
          ) {
            throw new BadRequestException({
              code: "PAYMENT_ALREADY_REVIEWED",
              details: { status: currentPayment?.status ?? null },
            });
          }
          if (
            nextStatus === PaymentStatus.SUCCESS &&
            !currentPayment.receiptImage
          ) {
            throw new BadRequestException({
              code: "PAYMENT_RECEIPT_REQUIRED",
              details: {},
            });
          }

          const currentInvoice = await tx.invoice.findUnique({
            where: { id: payment.invoiceId },
            select: { amount: true, status: true },
          });

          if (nextStatus === PaymentStatus.SUCCESS) {
            if (
              !currentInvoice ||
              currentInvoice.status === InvoiceStatus.CANCELLED
            ) {
              throw new BadRequestException({
                code: "INVOICE_NOT_PAYABLE",
                details: { status: currentInvoice?.status ?? null },
              });
            }

            const reservedPayments = await tx.payment.findMany({
              where: {
                invoiceId: payment.invoiceId,
                status: {
                  in: [PaymentStatus.SUCCESS, PaymentStatus.PENDING],
                },
                id: { not: paymentId },
              },
              select: { amount: true, status: true },
            });
            const totalReservedBeforeReview = reservedPayments.reduce(
              (sum, item) => sum + item.amount,
              0,
            );
            if (
              totalReservedBeforeReview + payment.amount >
              currentInvoice.amount
            ) {
              throw new BadRequestException({
                code: "PAYMENT_AMOUNT_EXCEEDS_REMAINING",
                details: {
                  remainingAmount: Math.max(
                    0,
                    currentInvoice.amount - totalReservedBeforeReview,
                  ),
                },
              });
            }
          }

          const updated = await tx.payment.updateMany({
            where: { id: paymentId, status: PaymentStatus.PENDING },
            data: {
              status: nextStatus,
              reviewedBy: reviewerId,
              reviewedAt: new Date(),
              reviewReason: reason?.trim() || null,
            },
          });

          if (updated.count !== 1) {
            throw new BadRequestException({
              code: "PAYMENT_ALREADY_REVIEWED",
              details: {},
            });
          }

          await tx.paymentEvent.create({
            data: {
              paymentId,
              type:
                nextStatus === PaymentStatus.SUCCESS
                  ? PaymentEventType.SUCCESS
                  : PaymentEventType.REJECTED,
              payloadJson: {
                status: nextStatus,
                reviewedBy: reviewerId,
                reason: reason?.trim() || null,
              },
            },
          });

          if (nextStatus === PaymentStatus.SUCCESS) {
            const successfulPayments = await tx.payment.findMany({
              where: {
                invoiceId: payment.invoiceId,
                status: PaymentStatus.SUCCESS,
              },
              select: { amount: true },
            });
            const totalPaid = successfulPayments.reduce(
              (sum, item) => sum + item.amount,
              0,
            );
            const invoiceUpdate = await tx.invoice.updateMany({
              where: {
                id: payment.invoiceId,
                status: { not: InvoiceStatus.CANCELLED },
              },
              data: {
                status:
                  totalPaid >= currentInvoice!.amount
                    ? InvoiceStatus.PAID
                    : currentInvoice!.status === InvoiceStatus.LATE
                      ? InvoiceStatus.LATE
                      : InvoiceStatus.PARTIAL,
                paidAt: totalPaid >= currentInvoice!.amount ? new Date() : null,
              },
            });
            if (invoiceUpdate.count !== 1) {
              throw new BadRequestException({
                code: "INVOICE_NOT_PAYABLE",
                details: {},
              });
            }
          }

          return tx.payment.findUniqueOrThrow({
            where: { id: paymentId },
            include: { reviewer: { select: { id: true, name: true } } },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        throw new ConflictException({
          code: "PAYMENT_REVIEW_CONFLICT",
          details: {},
        });
      }
      throw error;
    }

    if (nextStatus === PaymentStatus.SUCCESS) {
      const invoice = payment.invoice;
      const clientUser = await this.prisma.client.findUnique({
        where: { id: invoice.clientId },
        select: { userId: true },
      });
      await this.notifications.notifyUsers({
        userIds: [invoice.createdBy, clientUser?.userId].filter(
          Boolean,
        ) as string[],
        entityId: invoice.id,
        entityType: "INVOICE",
        eventType: "INVOICE_PAID",
      });
      this.clientCounterService
        .onInvoicePaid(invoice.id)
        .catch(() => undefined);
      if (invoice.contractId) {
        this.eventEmitter.emit("invoice.paid", {
          invoiceId: invoice.id,
          contractId: invoice.contractId,
          paymentPlanId: invoice.paymentPlanId,
          clientId: invoice.clientId,
          amount: invoice.amount,
          userId: reviewerId,
        });
      }
    }

    return updatedPayment;
  }

  async getInvoicePaymentDetails(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        contract: { select: { id: true, title: true, status: true } },
        items: true,
        payments: {
          include: {
            reviewer: { select: { id: true, name: true } },
            events: { orderBy: { createdAt: "asc" } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!invoice) {
      throw new NotFoundException({ code: "INVOICE_NOT_FOUND", details: {} });
    }

    const payments = await Promise.all(
      invoice.payments.map(async (payment) => ({
        id: payment.id,
        invoiceId: payment.invoiceId,
        clientId: payment.clientId,
        gatewayId: payment.gatewayId,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        providerPaymentId: payment.providerPaymentId,
        notes: payment.notes,
        date: payment.date,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        reviewedAt: payment.reviewedAt,
        reviewReason: payment.reviewReason,
        reviewer: payment.reviewer,
        receiptUrl: payment.receiptImage
          ? await this.storageService.getPresignedUrlIfExists(
              payment.receiptImage,
            )
          : null,
        events: payment.events.map((event) => ({
          id: event.id,
          type: event.type,
          createdAt: event.createdAt,
        })),
      })),
    );
    const paidAmount = payments
      .filter((payment) => payment.status === PaymentStatus.SUCCESS)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const pendingAmount = payments
      .filter((payment) => payment.status === PaymentStatus.PENDING)
      .reduce((sum, payment) => sum + payment.amount, 0);

    return {
      ...invoice,
      payments,
      paidAmount,
      pendingAmount,
      remainingAmount: Math.max(0, invoice.amount - paidAmount),
    };
  }

  async retryWebhookLog(webhookLogId: string) {
    const log = await this.prisma.webhookLog.findUnique({
      where: { id: webhookLogId },
    });
    if (!log) {
      throw new NotFoundException({
        code: "WEBHOOK_LOG_NOT_FOUND",
        details: {},
      });
    }
    if (log.processed) {
      throw new BadRequestException({
        code: "WEBHOOK_ALREADY_PROCESSED",
        details: {},
      });
    }

    const provider = await this.getProvider(log.provider);
    let event;
    try {
      event =
        typeof log.payload === "string" ? JSON.parse(log.payload) : log.payload;
    } catch {
      await this.prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: { error: "WEBHOOK_PAYLOAD_INVALID" },
      });
      throw new BadRequestException({
        code: "WEBHOOK_PAYLOAD_INVALID",
        details: {},
      });
    }

    try {
      const result = await provider.handleWebhookEvent(event);

      if (result) {
        await this.updatePaymentStatus(
          result.providerPaymentId,
          result.status,
          result.metadata,
          result.amount,
          result.currency,
        );
      }

      await this.prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: { processed: true, error: null },
      });

      return { success: true };
    } catch (error) {
      await this.prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: { error: "WEBHOOK_RETRY_FAILED" },
      });
      throw error;
    }
  }

  async processWebhook(provider: string, rawBody: any, signature: string) {
    const providerInstance = await this.getProvider(provider);

    let parsedBody: any = rawBody;
    if (Buffer.isBuffer(rawBody)) {
      try {
        parsedBody = JSON.parse(rawBody.toString("utf-8"));
      } catch {
        parsedBody = { type: "unknown" };
      }
    }

    const providerEventId =
      typeof parsedBody.id === "string" ? parsedBody.id : null;
    const existing = providerEventId
      ? await this.prisma.webhookLog.findUnique({
          where: {
            provider_providerEventId: { provider, providerEventId },
          },
        })
      : null;

    let log;
    if (existing?.processed) return;
    if (existing) {
      log = existing;
    } else {
      try {
        log = await this.prisma.webhookLog.create({
          data: {
            provider,
            providerEventId,
            eventType: parsedBody.type || "unknown",
            payload: parsedBody,
          },
        });
      } catch (error) {
        if (
          providerEventId &&
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          return;
        }
        throw error;
      }
    }

    try {
      const event = await providerInstance.verifyWebhook(rawBody, signature);
      const result = await providerInstance.handleWebhookEvent(event);

      if (result) {
        await this.updatePaymentStatus(
          result.providerPaymentId,
          result.status,
          result.metadata,
          result.amount,
          result.currency,
        );
      }

      await this.prisma.webhookLog.update({
        where: { id: log.id },
        data: { processed: true },
      });
    } catch (error) {
      await this.prisma.webhookLog.update({
        where: { id: log.id },
        data: { error: "WEBHOOK_PROCESSING_FAILED" },
      });
      throw error;
    }
  }

  async updatePaymentStatus(
    providerPaymentId: string,
    status: PaymentStatus,
    metadata?: any,
    providerAmount?: number,
    providerCurrency?: string,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentId },
      include: {
        invoice: {
          select: {
            id: true,
            contractId: true,
            paymentPlanId: true,
            clientId: true,
            amount: true,
            createdBy: true,
            invoiceNumber: true,
          },
        },
      },
    });

    if (!payment) return;
    if (status === PaymentStatus.SUCCESS) {
      if (providerAmount === undefined || !providerCurrency) {
        throw new BadRequestException({
          code: "PAYMENT_PROVIDER_AMOUNT_MISSING",
          details: {},
        });
      }
      if (
        providerCurrency.toUpperCase() !== payment.currency.toUpperCase() ||
        Math.abs(providerAmount - payment.amount) > 0.000001
      ) {
        throw new BadRequestException({
          code: "PAYMENT_PROVIDER_AMOUNT_MISMATCH",
          details: {
            expectedAmount: payment.amount,
            expectedCurrency: payment.currency,
          },
        });
      }
    }

    let invoicePaid = false;
    const updatedPayment = await this.prisma.$transaction(
      async (tx) => {
        const current = await tx.payment.findUnique({
          where: { id: payment.id },
          select: { status: true },
        });
        if (!current) return null;
        if (
          current.status === PaymentStatus.REFUNDED ||
          current.status === PaymentStatus.REJECTED ||
          current.status === status ||
          (current.status === PaymentStatus.SUCCESS &&
            status !== PaymentStatus.REFUNDED) ||
          (current.status === PaymentStatus.FAILED &&
            status === PaymentStatus.PENDING)
        ) {
          return null;
        }

        const changed = await tx.payment.updateMany({
          where: { id: payment.id, status: current.status },
          data: { status, metadataJson: metadata as any },
        });
        if (changed.count !== 1) return null;

        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            type: this.mapStatusToEventType(status),
            payloadJson: { status, metadata } as any,
          },
        });

        if (
          status === PaymentStatus.SUCCESS ||
          status === PaymentStatus.REFUNDED
        ) {
          const invoicePayments = await tx.payment.findMany({
            where: {
              invoiceId: payment.invoiceId,
              status: PaymentStatus.SUCCESS,
            },
          });
          const totalPaid = invoicePayments.reduce(
            (sum, pay) => sum + pay.amount,
            0,
          );
          invoicePaid = totalPaid >= payment.invoice.amount;

          await tx.invoice.update({
            where: { id: payment.invoiceId },
            data:
              status === PaymentStatus.SUCCESS && invoicePaid
                ? { status: InvoiceStatus.PAID, paidAt: new Date() }
                : totalPaid > 0
                  ? { status: InvoiceStatus.PARTIAL, paidAt: null }
                  : { status: InvoiceStatus.DUE, paidAt: null },
          });
        }

        return tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (!updatedPayment) return;

    if (status === PaymentStatus.SUCCESS && invoicePaid) {
      const clientUser = await this.prisma.client.findUnique({
        where: { id: payment.invoice.clientId },
        select: { userId: true },
      });
      await this.notifications.notifyUsers({
        userIds: [payment.invoice.createdBy, clientUser?.userId].filter(
          Boolean,
        ) as string[],
        entityId: payment.invoiceId,
        entityType: "INVOICE",
        eventType: "INVOICE_PAID",
      });
      this.clientCounterService
        .onInvoicePaid(payment.invoiceId)
        .catch(() => undefined);
      if (payment.invoice.contractId) {
        this.eventEmitter.emit("invoice.paid", {
          invoiceId: payment.invoiceId,
          contractId: payment.invoice.contractId,
          paymentPlanId: payment.invoice.paymentPlanId,
          clientId: payment.invoice.clientId,
          amount: payment.invoice.amount,
          userId: payment.invoice.createdBy,
        });
      }
    }

    return updatedPayment;
  }

  private mapStatusToEventType(status: PaymentStatus): PaymentEventType {
    switch (status) {
      case PaymentStatus.SUCCESS:
        return PaymentEventType.SUCCESS;
      case PaymentStatus.FAILED:
        return PaymentEventType.FAILED;
      case PaymentStatus.REJECTED:
        return PaymentEventType.REJECTED;
      case PaymentStatus.REFUNDED:
        return PaymentEventType.REFUNDED;
      default:
        return PaymentEventType.CREATED;
    }
  }

  async assertReceiptUploadAllowed(paymentId: string, clientUserId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        invoice: { client: { userId: clientUserId } },
      },
      select: { id: true, status: true, method: true, receiptImage: true },
    });
    if (!payment) {
      throw new NotFoundException({ code: "PAYMENT_NOT_FOUND", details: {} });
    }
    if (
      payment.method !== PaymentMethod.BANK_TRANSFER ||
      payment.status !== PaymentStatus.PENDING
    ) {
      throw new BadRequestException({
        code: "PAYMENT_RECEIPT_NOT_ALLOWED",
        details: { status: payment.status, method: payment.method },
      });
    }
    if (payment.receiptImage) {
      throw new BadRequestException({
        code: "PAYMENT_RECEIPT_ALREADY_ATTACHED",
        details: {},
      });
    }
  }

  async attachReceipt(
    paymentId: string,
    receiptPath: string,
    clientUserId: string,
  ) {
    await this.assertReceiptUploadAllowed(paymentId, clientUserId);
    const updated = await this.prisma.payment.updateMany({
      where: {
        id: paymentId,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
        receiptImage: null,
      },
      data: { receiptImage: receiptPath },
    });
    if (updated.count !== 1) {
      throw new BadRequestException({
        code: "PAYMENT_RECEIPT_NOT_ALLOWED",
        details: {},
      });
    }
    return this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
  }

  async getGateways() {
    const gateways = await this.prisma.paymentGateway.findMany();
    return gateways.map((g) => {
      let config: any = g.configJson;
      if (typeof config === "string") {
        try {
          config = JSON.parse(this.decrypt(config));
        } catch (e) {
          config = {};
        }
      }
      const fields: Record<string, boolean> = {};
      for (const key of ["secretKey", "webhookSecret", "publishableKey"]) {
        if (config[key]) fields[key] = true;
      }
      return {
        ...g,
        configJson: {
          fields,
          isConfigured: fields.secretKey || fields.publishableKey,
        },
      };
    });
  }

  async updateGatewayConfig(name: string, dto: UpdateGatewayDto) {
    const { isActive, secretKey, webhookSecret, publishableKey } = dto;
    const hasConfigFields = secretKey || webhookSecret || publishableKey;

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (hasConfigFields) {
      const config: Record<string, string> = {};
      if (secretKey) config.secretKey = secretKey;
      if (webhookSecret) config.webhookSecret = webhookSecret;
      if (publishableKey) config.publishableKey = publishableKey;
      updateData.configJson = this.encrypt(JSON.stringify(config)) as any;
    }

    return this.prisma.paymentGateway.upsert({
      where: { name },
      update: updateData,
      create: {
        name,
        type:
          name === "stripe"
            ? PaymentGatewayType.ONLINE
            : PaymentGatewayType.MANUAL,
        configJson: hasConfigFields
          ? (this.encrypt(
              JSON.stringify({ secretKey, webhookSecret, publishableKey }),
            ) as any)
          : undefined,
        isActive: isActive ?? true,
      },
    });
  }

  async deleteGateway(name: string) {
    return this.prisma.paymentGateway.update({
      where: { name },
      data: { isActive: false },
    });
  }

  async getBankAccounts(includeInactive?: boolean) {
    return this.prisma.bankAccount.findMany({
      where: includeInactive ? undefined : { isActive: true },
    });
  }

  async getPublicBankAccounts() {
    return this.prisma.bankAccount.findMany({
      where: { isActive: true },
      select: {
        id: true,
        bankName: true,
        accountName: true,
        accountNumber: true,
        iban: true,
        swiftCode: true,
        instructions: true,
        isDefault: true,
      },
    });
  }

  async getPublicConfig() {
    const gateway = await this.prisma.paymentGateway.findUnique({
      where: { name: "stripe" },
    });

    if (!gateway || !gateway.isActive) {
      return { publishableKey: null, isActive: false };
    }

    let config: any = gateway.configJson;
    if (typeof config === "string") {
      try {
        config = JSON.parse(this.decrypt(config));
      } catch {
        config = {};
      }
    }

    return {
      publishableKey: config.publishableKey ?? null,
      isActive: gateway.isActive,
    };
  }

  async getPublicGateways() {
    const gateways = await this.prisma.paymentGateway.findMany({
      where: { isActive: true },
      select: { name: true },
    });

    return gateways.map((g) => g.name);
  }

  private mapBankAccountDto(dto: any) {
    const mapped: any = { ...dto };
    if (dto.swift !== undefined) {
      mapped.swiftCode = dto.swift;
      delete mapped.swift;
    }
    if (dto.transferInstructions !== undefined) {
      mapped.instructions = dto.transferInstructions;
      delete mapped.transferInstructions;
    }
    return mapped;
  }

  async createBankAccount(dto: any) {
    return this.prisma.bankAccount.create({
      data: this.mapBankAccountDto(dto),
    });
  }

  async updateBankAccount(id: string, dto: any) {
    return this.prisma.bankAccount.update({
      where: { id },
      data: this.mapBankAccountDto(dto),
    });
  }

  async deleteBankAccount(id: string) {
    return this.prisma.bankAccount.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
