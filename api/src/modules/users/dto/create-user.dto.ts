import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  isString,
  Length,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(2)
  fullName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @Length(2, 2)
  country: string; // 'MX', 'US", "BR"
}
