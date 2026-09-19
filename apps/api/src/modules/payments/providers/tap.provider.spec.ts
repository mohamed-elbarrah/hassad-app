import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { TapProvider } from "./tap.provider";

type TapTestEvent = {
  id: string;
  amount: string;
  currency: string;
  reference: { gateway: string; payment: string };
  status: string;
  transaction: { created: string };
};

function signature(event: TapTestEvent, secret: string) {
  const input =
    `x_id${event.id}` +
    `x_amount${event.amount}` +
    `x_currency${event.currency}` +
    `x_gateway_reference${event.reference.gateway}` +
    `x_payment_reference${event.reference.payment}` +
    `x_status${event.status}` +
    `x_created${event.transaction.created}`;
  return createHmac("sha256", secret).update(input).digest("hex");
}

describe("TapProvider webhook verification", () => {
  const secret = "tap_test_secret";
  const provider = new TapProvider({
    secretKey: secret,
    webhookUrl: "https://api.example.com/v1/webhooks/tap",
  });

  it("accepts Tap's standard two-decimal amount representation", async () => {
    const event: TapTestEvent = {
      id: "chg_sar",
      amount: "10.00",
      currency: "SAR",
      reference: { gateway: "gw", payment: "pay" },
      status: "CAPTURED",
      transaction: { created: "2026-09-19T00:00:00Z" },
    };

    await expect(
      provider.verifyWebhook(JSON.stringify(event), signature(event, secret)),
    ).resolves.toMatchObject({ id: event.id });
  });

  it("preserves three-decimal currency precision for hash verification", async () => {
    const event: TapTestEvent = {
      id: "chg_kwd",
      amount: "1.000",
      currency: "KWD",
      reference: { gateway: "gw", payment: "pay" },
      status: "CAPTURED",
      transaction: { created: "2026-09-19T00:00:00Z" },
    };

    await expect(
      provider.verifyWebhook(JSON.stringify(event), signature(event, secret)),
    ).resolves.toMatchObject({ id: event.id });
  });

  it("rejects invalid signatures and malformed payloads", async () => {
    const event = {
      id: "chg_invalid",
      amount: "10.00",
      currency: "SAR",
      status: "CAPTURED",
    };

    await expect(
      provider.verifyWebhook(JSON.stringify(event), "invalid"),
    ).rejects.toThrow();
    await expect(provider.verifyWebhook("not-json", "invalid")).rejects.toThrow();
  });
});
