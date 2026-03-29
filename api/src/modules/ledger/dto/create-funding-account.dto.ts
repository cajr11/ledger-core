import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateFundingAccountDto {
  @ApiProperty({
    description: 'ISO 4217 currency code. One funding account is created per currency.',
    example: 'MXN',
  })
  @IsString()
  @Length(3, 4)
  currency: string;
}
