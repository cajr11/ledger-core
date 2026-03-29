import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class FundAccountDto {
  @ApiProperty({
    description: 'UUID of the user whose wallet will be funded',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'ISO 4217 currency code. Must match an existing system funding account and user wallet.',
    example: 'MXN',
  })
  @IsString()
  @Length(3, 4)
  currency: string;

  @ApiProperty({
    description: 'Amount to fund in the smallest currency unit (e.g. centavos)',
    example: '50000',
  })
  @IsString()
  amount: string;
}
