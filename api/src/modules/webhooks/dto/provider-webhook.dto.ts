import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ProviderWebhookDto {
  @ApiProperty({
    description: 'Event type from the provider',
    example: 'transfer.status_updated',
  })
  @IsString()
  event: string;

  @ApiProperty({
    description: 'Provider-generated reference ID for this transfer',
    example: 'stub-1774896156967-oe1b1bgezal',
  })
  @IsString()
  provider_ref: string;

  @ApiProperty({
    description: 'Raw status string from the provider (e.g. awaiting_funds, funds_received, payment_processed)',
    example: 'funds_received',
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'Your internal transfer UUID, passed as referenceId when initiating the transfer',
    example: '1b72bc90-b105-4608-b3d9-f7f9ce4fc780',
  })
  @IsString()
  reference_id: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp of when the event occurred',
    example: '2026-03-30T19:00:00Z',
  })
  @IsString()
  timestamp: string;
}
