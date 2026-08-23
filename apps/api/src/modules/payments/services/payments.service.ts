import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from "@nestjs/common";
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
      throw new BadRequestException(
        `Payment gateway ${gatewayName} is not available`,
      );
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
        throw new BadRequestException(`Unsupported gateway: ${gatewayName}`);
    }
  }

  async createElementPayment(dto: {
    invoiceId: string;
    amount: number;
    currency?: string;
  }) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
    });

    if (!invoice) throw new NotFoundException("Invoice not found");

    const provider = await this.getProvider("stripe");
    const gateway = await this.prisma.paymentGateway.findUnique({
      where: { name: "stripe" },
    });

    if (!provider.createElementPaymentIntent) {
      throw new BadRequestException("Gateway does not support element payment");
    }

    const intent = await provider.createElementPaymentIntent({
      invoiceId: invoice.id,
      amount: dto.amount,
      currency: dto.currency || "SAR",
      clientId: invoice.clientId,
    });

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        gatewayId: gateway!.id,
        amount: dto.amount,
        currency: dto.currency || "SAR",
        status: intent.status,
        method: PaymentMethod.CARD,
        providerPaymentId: intent.providerPaymentId,
        metadataJson: intent.metadata as any,
      },
    });

    await this.prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        type: PaymentEventType.CREATED,
        payloadJson: intent as any,
      },
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
  }) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
    });

    if (!invoice) throw new NotFoundException("Invoice not found");

    const provider = await this.getProvider(dto.gatewayName);
    const gateway = await this.prisma.paymentGateway.findUnique({
      where: { name: dto.gatewayName },
    });

    const intent = await provider.createPaymentIntent({
      invoiceId: invoice.id,
      amount: dto.amount,
      currency: dto.currency || "SAR",
      clientId: invoice.clientId,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    });

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        gatewayId: gateway!.id,
        amount: dto.amount,
        currency: dto.currency || "SAR",
        status: intent.status,
        method:
          dto.gatewayName === "stripe"
            ? PaymentMethod.CARD
            : PaymentMethod.BANK_TRANSFER,
        providerPaymentId: intent.providerPaymentId,
        metadataJson: intent.metadata as any,
      },
    });

    await this.prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        type: PaymentEventType.CREATED,
        payloadJson: intent as any,
      },
    });

    return {
      ...payment,
      clientSecret: intent.clientSecret,
    };
  }

  async retryWebhookLog(webhookLogId: string) {
    const log = await this.prisma.webhookLog.findUnique({
      where: { id: webhookLogId },
    });
    if (!log) throw new NotFoundException("Webhook log not found");
    if (log.processed)
      throw new BadRequestException("Webhook already processed");

    const provider = await this.getProvider(log.provider);
    const event =
      typeof log.payload === "string" ? JSON.parse(log.payload) : log.payload;

    try {
      const result = await provider.handleWebhookEvent(event);

      if (result) {
        await this.updatePaymentStatus(
          result.providerPaymentId,
          result.status,
          result.metadata,
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
        data: { error: error.message },
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

    const log = await this.prisma.webhookLog.create({
      data: {
        provider,
        eventType: parsedBody.type || "unknown",
        payload: parsedBody,
      },
    });

    try {
      const event = await providerInstance.verifyWebhook(rawBody, signature);
      const result = await providerInstance.handleWebhookEvent(event);

      if (result) {
        await this.updatePaymentStatus(
          result.providerPaymentId,
          result.status,
          result.metadata,
        );
      }

      await this.prisma.webhookLog.update({
        where: { id: log.id },
        data: { processed: true },
      });
    } catch (error) {
      await this.prisma.webhookLog.update({
        where: { id: log.id },
        data: { error: error.message },
      });
      throw error;
    }
  }

  async updatePaymentStatus(
    providerPaymentId: string,
    status: PaymentStatus,
    metadata?: any,
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
    if (payment.status === status) return;

    const updatedPayment = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: payment.id },
        data: { status, metadataJson: metadata as any },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: p.id,
          type: this.mapStatusToEventType(status),
          payloadJson: { status, metadata } as any,
        },
      });

      if (status === PaymentStatus.SUCCESS) {
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

        if (totalPaid >= payment.invoice.amount) {
          await tx.invoice.update({
            where: { id: payment.invoiceId },
            data: { status: InvoiceStatus.PAID, paidAt: new Date() },
          });

          const clientUser = await this.prisma.client.findUnique({
            where: { id: payment.invoice.clientId },
            select: { userId: true },
          });

          await this.notifications.notifyUsers({
            userIds: [
              payment.invoice.createdBy,
              clientUser?.userId,
            ].filter(Boolean) as string[],
            entityId: payment.invoiceId,
            entityType: "INVOICE",
            eventType: "INVOICE_PAID",
          });
        } else if (totalPaid > 0) {
          await tx.invoice.update({
            where: { id: payment.invoiceId },
            data: { status: InvoiceStatus.PARTIAL },
          });
        }
      }

      return p;
    });

    if (status === PaymentStatus.SUCCESS && payment.invoice.contractId) {
      this.eventEmitter.emit("invoice.paid", {
        invoiceId: payment.invoiceId,
        contractId: payment.invoice.contractId,
        paymentPlanId: payment.invoice.paymentPlanId,
        clientId: payment.invoice.clientId,
        amount: payment.invoice.amount,
        userId: payment.invoice.createdBy,
      });
    }

    // Refresh the owning client's denormalized counters so the portal
    // profile KPI grid stays in sync. Fire-and-forget — a counter glitch
    // must never break the payment confirmation the client just saw.
    // Mirrors the pattern in `contracts.service.ts:onContractSigned`.
    if (status === PaymentStatus.SUCCESS) {
      this.clientCounterService
        .onInvoicePaid(payment.invoiceId)
        .catch(() => undefined);
    }

    return updatedPayment;
  }

  private mapStatusToEventType(status: PaymentStatus): PaymentEventType {
    switch (status) {
      case PaymentStatus.SUCCESS:
        return PaymentEventType.SUCCESS;
      case PaymentStatus.FAILED:
        return PaymentEventType.FAILED;
      case PaymentStatus.REFUNDED:
        return PaymentEventType.REFUNDED;
      default:
        return PaymentEventType.CREATED;
    }
  }

  async attachReceipt(paymentId: string, receiptPath: string) {
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { receiptImage: receiptPath },
    });
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
          ? (this.encrypt(JSON.stringify({ secretKey, webhookSecret, publishableKey })) as any)
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
