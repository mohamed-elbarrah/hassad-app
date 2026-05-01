import { PaymentProvider, PaymentIntentResponse } from './payment-provider.interface';
import { PaymentStatus } from '@hassad/shared';

export class BankTransferProvider implements PaymentProvider {
  async createPaymentIntent(params: {
    invoiceId: string;
    amount: number;
    currency: string;
    clientId: string;
    metadata?: any;
  }): Promise<PaymentIntentResponse> {
    return {
      providerPaymentId: `BT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      clientSecret: '',
      status: PaymentStatus.PENDING,
    };
  }

  async verifyWebhook(payload: any, signature: string): Promise<any> {
    return null;
  }

  async handleWebhookEvent(event: any): Promise<any> {
    return null;
  }
}
