import { ApiProperty } from '@nestjs/swagger';
import { Match } from '../../shared/decorator/Match';
import {
  IsNotEmpty,
  Allow,
  IsPhoneNumber,
  IsStrongPassword,
} from 'class-validator';

export class CompleteRecoverPasswordPayloadDto {
  @ApiProperty({
    type: String,
    description: 'An international phone number(e.g: +525544325690)',
    required: true,
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  @Allow()
  phone: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @Allow()
  code: string;

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
