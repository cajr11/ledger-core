import { ApiProperty } from '@nestjs/swagger';
import { IsDecimal, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateTransferDto {
  @ApiProperty({
    description: 'Client-generated UUID. Reuse the same key when retrying a failed request to prevent duplicate transfers.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  idempotencyKey: string;

  @ApiProperty({ description: 'UUID of the sending user', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  senderId: string;

  @ApiProperty({
    description: 'UUID of the receiving user. Required for same-currency transfers, omit for cross-border.',
    example: 'f9e8d7c6-b5a4-3210-fedc-ba0987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  recipientId?: string;

  @ApiProperty({
    description: 'External recipient details for cross-border transfers (name, bank account, etc.)',
    required: false,
    example: { name: 'Kwame Asante', country: 'GH', bankCode: '030100', accountNumber: '1234567890' },
  })
  @IsOptional()
  @IsObject()
  recipientDetails?: Record<string, any>;

  @ApiProperty({ description: 'ISO 4217 currency code of the sender account', example: 'MXN' })
  @IsString()
  senderCurrency: string;

  @ApiProperty({ description: 'ISO 4217 currency code of the recipient', example: 'NGN' })
  @IsString()
  recipientCurrency: string;

  @ApiProperty({ description: 'Transfer amount in the smallest currency unit', example: '50000' })
  @IsString()
  amount: string;
}
