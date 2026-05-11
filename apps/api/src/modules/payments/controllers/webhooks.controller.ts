import { Controller, Post, Body, Headers, Param, BadRequestException, RawBodyRequest, Req } from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':provider')
  async handleWebhook(
    @Param('provider') provider: string,
    @Headers('stripe-signature') stripeSignature: string,
    @Req() req: RawBodyRequest<any>,
  ) {
    if (provider === 'stripe') {
      if (!stripeSignature) throw new BadRequestException('Missing stripe signature');
      const payload = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
      await this.paymentsService.processWebhook('stripe', payload, stripeSignature);
    }

    return { received: true };
  }
}
