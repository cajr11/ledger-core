import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateQuoteDto {
  @ApiProperty({
    description: 'ISO 4217 currency code the sender is paying in',
    example: 'MXN',
  })
  @IsString()
  senderCurrency: string;

  @ApiProperty({
    description: 'ISO 4217 currency code the recipient will receive',
    example: 'NGN',
  })
  @IsString()
  recipientCurrency: string;

  @ApiProperty({
    description: 'Amount to send in the smallest currency unit',
    example: '50000',
  })
  @IsString()
  amount: string;
}
