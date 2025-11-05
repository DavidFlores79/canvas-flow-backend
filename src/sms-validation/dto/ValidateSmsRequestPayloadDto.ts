import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  Allow,
  Length,
  IsUUID,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { SmsValidationAction } from '../enum/SmsValidationAction';

export class ValidateSmsRequestPayloadDto {
  @ApiProperty({
    type: String,
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  @Allow()
  id: string;

  @ApiProperty({ type: String, required: true })
  @Length(6, 6)
  @IsNotEmpty()
  @Allow()
  code: string;

  @ApiProperty({
    type: String,
    example: 'confirm_sign_up | recover_password',
    enum: SmsValidationAction,
    required: false,
  })
  @IsEnum(SmsValidationAction)
  @IsOptional()
  smsAction?: string;
}
