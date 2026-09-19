import { PaymentStatus } from "@hassad/shared";

export interface PaymentIntentResponse {
  providerPaymentId: string;
  clientSecret?: string;
  checkoutUrl?: string;
  status: PaymentStatus;
  metadata?: unknown;
}

export interface ProviderPaymentStatus {
  providerPaymentId: string;
  status: PaymentStatus;
  amount?: number;
  currency?: string;
  metadata?: unknown;
}

export interface CreatePaymentIntentParams {
  invoiceId: string;
  amount: number;
  currency: string;
  clientId: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: unknown;
  idempotencyKey?: string;
  customer?: {
    firstName: string;
    lastName?: string;
    email: string;
    phone?: { countryCode: string; number: string };
  };
}

export interface ElementPaymentIntentParams {
  invoiceId: string;
  amount: number;
  currency: string;
  clientId: string;
  metadata?: unknown;
}

export interface PaymentProvider {
  createPaymentIntent(
    params: CreatePaymentIntentParams,
  ): Promise<PaymentIntentResponse>;

  createElementPaymentIntent?(
    params: ElementPaymentIntentParams,
  ): Promise<PaymentIntentResponse>;

  verifyWebhook(payload: unknown, signature: string): Promise<unknown>;

  handleWebhookEvent(event: unknown): Promise<ProviderPaymentStatus>;

  retrievePayment?(providerPaymentId: string): Promise<ProviderPaymentStatus>;
}
