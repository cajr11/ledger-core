import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TransferStatus } from 'src/types';

export class UpdateTransferStatusDto {
  @ApiProperty({
    description: 'New status for the transfer',
    enum: TransferStatus,
    example: TransferStatus.COMPLETED,
  })
  @IsEnum(TransferStatus)
  toStatus: TransferStatus;

  @ApiProperty({
    description: 'Who or what triggered the status change (e.g. "system", "webhook:provider-name", or a user ID)',
    example: 'system',
  })
  @IsString()
  changedBy: string;

  @ApiProperty({
    description: 'Optional JSON metadata with additional context about the status change',
    required: false,
    example: { reason: 'Transfer completed successfully' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
