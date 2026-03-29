import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/client';
import { IsDecimal, IsString } from 'class-validator';

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

  @ApiProperty({ description: 'UUID of the receiving user', example: 'f9e8d7c6-b5a4-3210-fedc-ba0987654321' })
  @IsString()
  recipientId: string;

  @ApiProperty({ description: 'ISO 4217 currency code of the sender account', example: 'MXN' })
  @IsString()
  senderCurrency: string;

  @ApiProperty({ description: 'ISO 4217 currency code of the recipient account', example: 'MXN' })
  @IsString()
  recipientCurrency: string;

  @ApiProperty({ description: 'Transfer amount in the smallest currency unit as a decimal string', example: '100.50' })
  @IsDecimal()
  amount: Decimal;
}
