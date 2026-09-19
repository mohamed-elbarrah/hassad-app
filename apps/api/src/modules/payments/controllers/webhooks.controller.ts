import {
  Controller,
  Post,
  Headers,
  Param,
  BadRequestException,
  RawBodyRequest,
  Req,
} from "@nestjs/common";
import { PaymentsService } from "../services/payments.service";

@Controller("webhooks")
export class WebhooksController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(":provider")
  async handleWebhook(
    @Param("provider") provider: string,
    @Headers("stripe-signature") stripeSignature: string,
    @Headers("hashstring") tapHashstring: string,
    @Req() req: RawBodyRequest<any>,
  ) {
    const signature = provider === "tap" ? tapHashstring : stripeSignature;
    if (!signature) {
      throw new BadRequestException({
        code: "WEBHOOK_SIGNATURE_REQUIRED",
        details: { provider },
      });
    }

    if (provider === "stripe" || provider === "tap") {
      const payload = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
      await this.paymentsService.processWebhook(provider, payload, signature);
    } else {
      throw new BadRequestException({
        code: "WEBHOOK_PROVIDER_UNSUPPORTED",
        details: { provider },
      });
    }

    return { received: true };
  }
}
