import { PaymentStatus, PaymentMethod } from '@hassad/shared';

export interface PaymentIntentResponse {
  providerPaymentId: string;
  clientSecret: string;
  status: PaymentStatus;
  metadata?: any;
}

export interface PaymentProvider {
  createPaymentIntent(params: {
    invoiceId: string;
    amount: number;
    currency: string;
    clientId: string;
    metadata?: any;
  }): Promise<PaymentIntentResponse>;

  verifyWebhook(payload: any, signature: string): Promise<any>;

  handleWebhookEvent(event: any): Promise<{
    providerPaymentId: string;
    status: PaymentStatus;
    metadata?: any;
  }>;
}
