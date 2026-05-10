import { Stripe } from 'stripe';
import { PaymentProvider, PaymentIntentResponse } from './payment-provider.interface';
import { PaymentStatus } from '@hassad/shared';

const STRIPE_API_VERSION = '2025-03-31.basil';

export class StripeProvider implements PaymentProvider {
  private stripe: Stripe;

  constructor(private config: { secretKey: string; webhookSecret: string }) {
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: STRIPE_API_VERSION as any,
      maxNetworkRetries: 3,
    });
  }

  async createPaymentIntent(params: {
    invoiceId: string;
    amount: number;
    currency: string;
    clientId: string;
    successUrl?: string;
    cancelUrl?: string;
    metadata?: any;
  }): Promise<PaymentIntentResponse> {
    const successUrl = params.successUrl ?? `${process.env.WEB_URL}/portal/finance?success=true`;
    const cancelUrl = params.cancelUrl ?? `${process.env.WEB_URL}/portal/finance?canceled=true`;

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: {
              name: `فاتورة ${params.invoiceId}`,
            },
            unit_amount: Math.round(params.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        invoiceId: params.invoiceId,
        clientId: params.clientId,
        ...params.metadata,
      },
    });

    return {
      providerPaymentId: session.id,
      clientSecret: session.url ?? '',
      status: PaymentStatus.PENDING,
    };
  }

  async verifyWebhook(payload: any, signature: string): Promise<any> {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.config.webhookSecret,
    );
  }

  async handleWebhookEvent(event: any): Promise<{
    providerPaymentId: string;
    status: PaymentStatus;
    metadata?: any;
  }> {
    const object = event.data.object as any;
    let status: PaymentStatus = PaymentStatus.PENDING;

    switch (event.type) {
      case 'checkout.session.completed':
      case 'payment_intent.succeeded':
        status = PaymentStatus.SUCCESS;
        break;
      case 'payment_intent.payment_failed':
        status = PaymentStatus.FAILED;
        break;
      case 'payment_intent.processing':
        status = PaymentStatus.PENDING;
        break;
      case 'payment_intent.canceled':
        status = PaymentStatus.FAILED;
        break;
    }

    return {
      providerPaymentId: object.id,
      status,
      metadata: object.metadata,
    };
  }

  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case 'succeeded':
        return PaymentStatus.SUCCESS;
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
      case 'processing':
        return PaymentStatus.PENDING;
      case 'canceled':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
