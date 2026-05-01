import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { 
  PaymentStatus, 
  PaymentGatewayType, 
  PaymentMethod, 
  PaymentEventType,
  InvoiceStatus,
} from '@hassad/shared';
import { StripeProvider } from '../providers/stripe.provider';
import { BankTransferProvider } from '../providers/bank-transfer.provider';
import { PaymentProvider } from '../providers/payment-provider.interface';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly ALGORITHM = 'aes-256-cbc';
  private readonly ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY || 'hassad-platform-secret-key-32chars';
  private readonly IV_LENGTH = 16;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, Buffer.from(this.ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  private decrypt(text: string): string {
    try {
      const textParts = text.split(':');
      const iv = Buffer.from(textParts.shift()!, 'hex');
      const encryptedText = Buffer.from(textParts.join(':'), 'hex');
      const decipher = crypto.createDecipheriv(this.ALGORITHM, Buffer.from(this.ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
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
      throw new BadRequestException(`Payment gateway ${gatewayName} is not available`);
    }

    let config: any = gateway.configJson;
    if (typeof config === 'string') {
      config = JSON.parse(this.decrypt(config));
    }

    switch (gatewayName) {
      case 'stripe':
        return new StripeProvider({
          secretKey: config.secretKey,
          webhookSecret: config.webhookSecret,
        });
      case 'bank_transfer':
        return new BankTransferProvider();
      default:
        throw new BadRequestException(`Unsupported gateway: ${gatewayName}`);
    }
  }

  async createPayment(dto: {
    invoiceId: string;
    gatewayName: string;
    amount: number;
    currency?: string;
  }) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const provider = await this.getProvider(dto.gatewayName);
    const gateway = await this.prisma.paymentGateway.findUnique({ where: { name: dto.gatewayName } });

    const intent = await provider.createPaymentIntent({
      invoiceId: invoice.id,
      amount: dto.amount,
      currency: dto.currency || 'SAR',
      clientId: invoice.clientId,
    });

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        gatewayId: gateway!.id,
        amount: dto.amount,
        currency: dto.currency || 'SAR',
        status: intent.status,
        method: dto.gatewayName === 'stripe' ? PaymentMethod.CARD : PaymentMethod.BANK_TRANSFER,
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

  async processWebhook(provider: string, payload: any, signature: string) {
    const providerInstance = await this.getProvider(provider);
    
    const log = await this.prisma.webhookLog.create({
      data: {
        provider,
        eventType: payload.type || 'unknown',
        payload: payload as any,
      },
    });

    try {
      const event = await providerInstance.verifyWebhook(payload, signature);
      const result = await providerInstance.handleWebhookEvent(event);

      if (result) {
        await this.updatePaymentStatus(result.providerPaymentId, result.status, result.metadata);
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

  async updatePaymentStatus(providerPaymentId: string, status: PaymentStatus, metadata?: any) {
    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentId },
      include: { invoice: true },
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
          where: { invoiceId: payment.invoiceId, status: PaymentStatus.SUCCESS },
        });

        const totalPaid = invoicePayments.reduce((sum, pay) => sum + pay.amount, 0);
        
        if (totalPaid >= payment.invoice.amount) {
          await tx.invoice.update({
            where: { id: payment.invoiceId },
            data: { 
              status: InvoiceStatus.PAID,
              paidAt: new Date(),
            },
          });

          await this.notifications.createNotification({
            entityId: payment.invoiceId,
            entityType: 'INVOICE',
            eventType: 'INVOICE_PAID',
            userId: payment.invoice.createdBy,
            title: 'تم دفع الفاتورة',
            body: `تم دفع الفاتورة ${payment.invoice.invoiceNumber} بالكامل`,
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

    return updatedPayment;
  }

  private mapStatusToEventType(status: PaymentStatus): PaymentEventType {
    switch (status) {
      case PaymentStatus.SUCCESS: return PaymentEventType.SUCCESS;
      case PaymentStatus.FAILED: return PaymentEventType.FAILED;
      case PaymentStatus.REFUNDED: return PaymentEventType.REFUNDED;
      default: return PaymentEventType.CREATED;
    }
  }

  async getGateways() {
    const gateways = await this.prisma.paymentGateway.findMany();
    return gateways.map(g => {
      let config = g.configJson;
      if (typeof config === 'string') {
        try {
          config = JSON.parse(this.decrypt(config));
        } catch(e) {}
      }
      return { ...g, configJson: config };
    });
  }

  async updateGatewayConfig(name: string, dto: any) {
    const { isActive, ...config } = dto;
    const encryptedConfig = this.encrypt(JSON.stringify(config));

    return this.prisma.paymentGateway.upsert({
      where: { name },
      update: { configJson: encryptedConfig as any, isActive: isActive ?? true },
      create: { 
        name, 
        type: name === 'stripe' ? PaymentGatewayType.ONLINE : PaymentGatewayType.MANUAL,
        configJson: encryptedConfig as any,
        isActive: isActive ?? true
      },
    });
  }

  async getBankAccounts() {
    return this.prisma.bankAccount.findMany();
  }

  async createBankAccount(dto: any) {
    return this.prisma.bankAccount.create({ data: dto });
  }

  async updateBankAccount(id: string, dto: any) {
    return this.prisma.bankAccount.update({ where: { id }, data: dto });
  }

  async deleteBankAccount(id: string) {
    return this.prisma.bankAccount.delete({ where: { id } });
  }
}
