import { PaymentProvider, PaymentIntentResponse, CreatePaymentIntentParams } from './payment-provider.interface';
import { PaymentStatus } from '@hassad/shared';

export class BankTransferProvider implements PaymentProvider {
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResponse> {
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
