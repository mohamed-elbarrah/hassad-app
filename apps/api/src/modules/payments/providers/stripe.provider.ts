import { BadRequestException } from "@nestjs/common";
import { Stripe } from "stripe";
import {
  PaymentProvider,
  PaymentIntentResponse,
} from "./payment-provider.interface";
import { PaymentStatus } from "@hassad/shared";

const STRIPE_API_VERSION = "2025-03-31.basil";
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "MGA",
  "KMF",
  "KRW",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);
const THREE_DECIMAL_CURRENCIES = new Set(["BHD", "JOD", "KWD", "OMR", "TND"]);

function stripeCurrencyMultiplier(currency: string) {
  const normalizedCurrency = currency.toUpperCase();
  return ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency)
    ? 1
    : THREE_DECIMAL_CURRENCIES.has(normalizedCurrency)
      ? 1000
      : 100;
}

function toStripeMinorUnits(amount: number, currency: string) {
  const minorAmount = amount * stripeCurrencyMultiplier(currency);
  const roundedAmount = Math.round(minorAmount);
  if (Math.abs(minorAmount - roundedAmount) > 1e-8) {
    throw new BadRequestException({
      code: "PAYMENT_AMOUNT_PRECISION_INVALID",
      details: { currency: currency.toUpperCase() },
    });
  }
  return roundedAmount;
}

function fromStripeMinorUnits(amount: number, currency: string) {
  return amount / stripeCurrencyMultiplier(currency);
}

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
    const successUrl =
      params.successUrl ?? `${process.env.WEB_URL}/portal/finance?success=true`;
    const cancelUrl =
      params.cancelUrl ?? `${process.env.WEB_URL}/portal/finance?canceled=true`;

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: {
              name: `فاتورة ${params.invoiceId}`,
            },
            unit_amount: toStripeMinorUnits(params.amount, params.currency),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
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
      clientSecret: session.url ?? "",
      status: PaymentStatus.PENDING,
    };
  }

  async createElementPaymentIntent(params: {
    invoiceId: string;
    amount: number;
    currency: string;
    clientId: string;
    metadata?: any;
  }): Promise<PaymentIntentResponse> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: toStripeMinorUnits(params.amount, params.currency),
      currency: params.currency.toLowerCase(),
      metadata: {
        invoiceId: params.invoiceId,
        clientId: params.clientId,
        ...params.metadata,
      },
      payment_method_types: ["card"],
    });

    return {
      providerPaymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret ?? "",
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
    amount?: number;
    currency?: string;
    metadata?: any;
  }> {
    const object = event.data.object as any;
    let status: PaymentStatus = PaymentStatus.PENDING;

    switch (event.type) {
      case "checkout.session.completed":
      case "payment_intent.succeeded":
        status = PaymentStatus.SUCCESS;
        break;
      case "payment_intent.payment_failed":
        status = PaymentStatus.FAILED;
        break;
      case "payment_intent.processing":
        status = PaymentStatus.PENDING;
        break;
      case "payment_intent.canceled":
        status = PaymentStatus.FAILED;
        break;
      case "charge.refunded":
      case "charge.refund.updated":
        if (
          event.type === "charge.refund.updated" &&
          object.status !== "succeeded"
        ) {
          status = PaymentStatus.PENDING;
        } else {
          status = PaymentStatus.REFUNDED;
        }
        break;
    }

    const currency =
      typeof object.currency === "string"
        ? object.currency.toUpperCase()
        : undefined;
    const minorAmount =
      object.amount_received ??
      object.amount_total ??
      object.amount ??
      object.amount_refunded;

    return {
      providerPaymentId:
        event.type === "checkout.session.completed"
          ? object.id
          : typeof object.payment_intent === "string"
            ? object.payment_intent
            : object.id,
      status,
      amount:
        typeof minorAmount === "number" && currency
          ? fromStripeMinorUnits(minorAmount, currency)
          : undefined,
      currency,
      metadata: object.metadata,
    };
  }

  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case "succeeded":
        return PaymentStatus.SUCCESS;
      case "requires_payment_method":
      case "requires_confirmation":
      case "requires_action":
      case "processing":
        return PaymentStatus.PENDING;
      case "canceled":
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
