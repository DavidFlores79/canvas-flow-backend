import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  Allow,
  IsPhoneNumber,
  IsStrongPassword,
  IsString,
  IsOptional,
} from 'class-validator';
import { Match } from '../../shared/decorator/Match';

export class SignUpPayloadDto {
  @ApiProperty({ type: String, required: false, nullable: false })
  @IsOptional()
  @IsString()
  @Allow()
  firstName?: string;

  @ApiProperty({ type: String, required: false, nullable: false })
  @IsOptional()
  @IsString()
  @Allow()
  middleName?: string;

  @ApiProperty({ type: String, required: false, nullable: false })
  @IsOptional()
  @IsString()
  @Allow()
  lastName?: string;

  @ApiProperty({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  @Allow()
  secondLastName?: string;

  @ApiProperty({
    type: String,
    description: 'An international phone number(e.g: +525544325690)',
    required: true,
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  @Allow()
  phone: string;

  @ApiProperty({
    type: String,
    description: 'An international phone code (e.g: MX for Mexico)',
    required: true,
  })
  @IsNotEmpty()
  @Allow()
  phoneCode: string;

  @ApiProperty({
    type: String,
    description:
      'At least 8 characters, one uppercase, one lowercase, one number, one symbol',
    required: true,
  })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @IsNotEmpty()
  @Allow()
  password: string;

  @ApiProperty({
    type: String,
    description: 'Must match password',
    required: true,
  })
  @Match('password')
  @IsNotEmpty()
  @Allow()
  confirmPassword: string;
}
