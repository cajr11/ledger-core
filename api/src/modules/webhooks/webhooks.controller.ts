import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { ProviderWebhookDto } from './dto/provider-webhook.dto';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('provider')
  @ApiOperation({
    summary: 'Receive a status update webhook from a payment provider',
    description:
      'Called by external providers (or the stub) when a transfer status changes. ' +
      'Stores the raw event in provider_events, maps the status to internal TransferStatus, ' +
      'and updates the transfer record with history.',
  })
  @ApiResponse({ status: 201, description: 'Webhook received and processed' })
  @ApiResponse({ status: 404, description: 'No transfer found for the given reference_id' })
  async handleProviderWebhook(@Body() payload: ProviderWebhookDto) {
    this.logger.log(
      `Webhook received: ${payload.status} for ${payload.reference_id}`,
    );

    return this.webhooksService.handleProviderEvent(payload);
  }
}
