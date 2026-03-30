import { Body, Controller, Logger, Post } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('provider')
  async handleProviderWebhook(@Body() payload: any) {
    this.logger.log(
      `Webhook received: ${payload.status} for ${payload.reference_id}`,
    );

    return this.webhooksService.handleProviderEvent(payload);
  }
}
