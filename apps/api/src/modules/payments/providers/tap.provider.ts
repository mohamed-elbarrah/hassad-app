import { BadGatewayException, BadRequestException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import { PaymentStatus } from "@hassad/shared";
import {
  CreatePaymentIntentParams,
  PaymentIntentResponse,
  PaymentProvider,
  ProviderPaymentStatus,
} from "./payment-provider.interface";

const TAP_API_BASE_URL = "https://api.tap.company/v2";
const THREE_DECIMAL_CURRENCIES = new Set(["BHD", "JOD", "KWD", "OMR"]);

type TapCharge = {
  id?: unknown;
  status?: unknown;
  amount?: unknown;
  currency?: unknown;
  metadata?: unknown;
  reference?: {
    gateway?: unknown;
    payment?: unknown;
    transaction?: unknown;
    order?: unknown;
  };
  transaction?: { url?: unknown; created?: unknown };
  redirect?: { url?: unknown };
};

function stringValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function numericValue(value: unknown): number | undefined {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed)
    ? parsed
    : undefined;
}

function canonicalTapHashAmount(value: unknown, currency: string): string {
  const decimals = THREE_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 3 : 2;
  const raw = typeof value === "string" ? value : "";
  if (new RegExp(`^\\d+\\.\\d{${decimals}}$`).test(raw)) return raw;
  const amount = numericValue(value) ?? 0;
  return amount.toFixed(decimals);
}

function tapStatus(status: string): PaymentStatus {
  switch (status.toUpperCase()) {
    case "CAPTURED":
    case "PAID":
      return PaymentStatus.SUCCESS;
    case "FAILED":
    case "DECLINED":
    case "CANCELLED":
    case "ABANDONED":
    case "TIMEDOUT":
    case "RESTRICTED":
    case "VOID":
    case "REVERSED":
      return PaymentStatus.FAILED;
    case "REFUNDED":
      return PaymentStatus.REFUNDED;
    default:
      return PaymentStatus.PENDING;
  }
}

export class TapProvider implements PaymentProvider {
  constructor(
    private readonly config: {
      secretKey: string;
      sourceId?: string;
      webhookUrl?: string;
    },
  ) {}

  async createPaymentIntent(
    params: CreatePaymentIntentParams,
  ): Promise<PaymentIntentResponse> {
    const customer = params.customer;
    if (!customer?.firstName || !customer.email) {
      throw new BadRequestException({
        code: "PAYMENT_CUSTOMER_DETAILS_REQUIRED",
        details: { gateway: "tap" },
      });
    }

    const response = await this.request<TapCharge>("/charges", {
      amount: params.amount,
      currency: params.currency.toUpperCase(),
      customer_initiated: true,
      threeDSecure: true,
      description: `Invoice ${params.invoiceId}`,
      metadata: {
        ...(params.metadata && typeof params.metadata === "object"
          ? params.metadata
          : {}),
        invoiceId: params.invoiceId,
        clientId: params.clientId,
      },
      // Tap uses `reference.idempotent` to make retries for the same checkout
      // return the same charge instead of creating a second charge.
      reference: {
        order: params.invoiceId,
        transaction: params.invoiceId,
        idempotent: params.idempotencyKey ?? params.invoiceId,
      },
      customer: {
        first_name: customer.firstName,
        ...(customer.lastName ? { last_name: customer.lastName } : {}),
        email: customer.email,
        ...(customer.phone
          ? {
              phone: {
                country_code: customer.phone.countryCode,
                number: customer.phone.number,
              },
            }
          : {}),
      },
      source: { id: this.config.sourceId ?? "src_all" },
      post: {
        url: this.config.webhookUrl ?? process.env.PAYMENTS_WEBHOOK_URL ?? "",
      },
      redirect: {
        url:
          params.successUrl ??
          `${process.env.WEB_URL ?? process.env.FRONTEND_URL ?? "http://localhost:3000"}/portal/finance`,
      },
    });

    const providerPaymentId = stringValue(response.id);
    if (!providerPaymentId) {
      throw new BadGatewayException({
        code: "PAYMENT_PROVIDER_RESPONSE_INVALID",
        details: { gateway: "tap" },
      });
    }

    const checkoutUrl =
      stringValue(response.transaction?.url) ||
      stringValue(response.redirect?.url);

    return {
      providerPaymentId,
      clientSecret: "",
      checkoutUrl: checkoutUrl || undefined,
      status: tapStatus(stringValue(response.status)),
      metadata: response.metadata,
    };
  }

  async retrievePayment(providerPaymentId: string): Promise<ProviderPaymentStatus> {
    const response = await this.request<TapCharge>(
      `/charges/${encodeURIComponent(providerPaymentId)}`,
    );
    return this.mapPayment(response);
  }

  async verifyWebhook(payload: unknown, signature: string): Promise<TapCharge> {
    if (!signature) {
      throw new BadRequestException({
        code: "WEBHOOK_SIGNATURE_REQUIRED",
        details: { provider: "tap" },
      });
    }

    const raw = Buffer.isBuffer(payload)
      ? payload.toString("utf8")
      : typeof payload === "string"
        ? payload
        : JSON.stringify(payload);
    let event: TapCharge;
    try {
      event = JSON.parse(raw) as TapCharge;
    } catch {
      throw new BadRequestException({
        code: "WEBHOOK_PAYLOAD_INVALID",
        details: { provider: "tap" },
      });
    }

    const id = stringValue(event.id);
    const amount = numericValue(event.amount) ?? 0;
    const currency = stringValue(event.currency).toUpperCase();
    const rawAmount = raw.match(/"amount"\s*:\s*(-?\d+(?:\.\d+)?)/)?.[1];
    const amountForHash = canonicalTapHashAmount(
      rawAmount ?? event.amount,
      currency,
    );
    const gatewayReference = stringValue(event.reference?.gateway);
    const paymentReference = stringValue(event.reference?.payment);
    const status = stringValue(event.status);
    const created = stringValue(event.transaction?.created);
    const hashInput =
      `x_id${id}` +
      `x_amount${amountForHash}` +
      `x_currency${currency}` +
      `x_gateway_reference${gatewayReference}` +
      `x_payment_reference${paymentReference}` +
      `x_status${status}` +
      `x_created${created}`;
    const expected = this.hmac(hashInput);
    const expectedBuffer = Buffer.from(expected, "utf8");
    const receivedBuffer = Buffer.from(signature, "utf8");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new BadRequestException({
        code: "WEBHOOK_SIGNATURE_INVALID",
        details: { provider: "tap" },
      });
    }

    return event;
  }

  async handleWebhookEvent(event: TapCharge): Promise<ProviderPaymentStatus> {
    return this.mapPayment(event);
  }

  private mapPayment(event: TapCharge): ProviderPaymentStatus {
    const providerPaymentId = stringValue(event.id);
    const currency = stringValue(event.currency).toUpperCase();
    if (!providerPaymentId || !currency) {
      throw new BadRequestException({
        code: "PAYMENT_PROVIDER_RESPONSE_INVALID",
        details: { gateway: "tap" },
      });
    }

    return {
      providerPaymentId,
      status: tapStatus(stringValue(event.status)),
      amount: numericValue(event.amount),
      currency,
      metadata: event.metadata,
    };
  }

  private hmac(value: string): string {
    return createHmac("sha256", this.config.secretKey)
      .update(value)
      .digest("hex");
  }

  private async request<T>(path: string, body?: unknown): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${TAP_API_BASE_URL}${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          Authorization: `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new BadGatewayException({
        code: "PAYMENT_PROVIDER_UNAVAILABLE",
        details: { gateway: "tap" },
      });
    }

    if (!response.ok) {
      throw new BadGatewayException({
        code: "PAYMENT_PROVIDER_REQUEST_FAILED",
        details: { gateway: "tap", status: response.status },
      });
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new BadGatewayException({
        code: "PAYMENT_PROVIDER_RESPONSE_INVALID",
        details: { gateway: "tap" },
      });
    }
  }
}
