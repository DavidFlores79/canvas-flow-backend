// src/sms/dto/create-sms-validation-payload.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  MaxLength,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { Status } from '../../users/enum/UserEnum';
import { SmsValidationAction } from '../enum/SmsValidationAction';
import { SmsValidationStatus } from '../enum/SmsValidationStatus';
import { SmsValidationProvider } from '../enum/SmsValidationProvider';

export class CreateSmsValidationPayloadDto {
  @ApiProperty({
    type: String,
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsUUID()
  @MaxLength(50)
  userId: string;

  @ApiProperty({ type: String, example: '+52559991992696', required: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone: string;

  @ApiProperty({
    type: String,
    enum: Status,
    example: 'created | registered | duplicate | validated | blocked',
    required: false,
  })
  @IsEnum(Status)
  @IsOptional()
  status?: string;

  @ApiProperty({
    type: String,
    example: 'VEXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  smsServiceSid?: string;

  @ApiProperty({
    type: String,
    example: 'VAXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  smsRequestSid?: string;

  @ApiProperty({
    type: String,
    example: 'twilio | other_provider',
    enum: SmsValidationProvider,
    required: false,
  })
  @IsEnum(SmsValidationProvider)
  @IsOptional()
  smsProvider?: string;

  @ApiProperty({
    type: String,
    example: 'confirm_sign_up | recover_password',
    enum: SmsValidationAction,
    required: false,
  })
  @IsEnum(SmsValidationAction)
  @IsOptional()
  smsAction?: string;

  @ApiProperty({
    type: String,
    example: 'pending | approved | canceled',
    enum: SmsValidationStatus,
    required: false,
  })
  @IsEnum(SmsValidationStatus)
  @IsOptional()
  smsStatus?: string;

  @ApiProperty({
    type: Date,
    example: new Date().toISOString(),
    required: false,
  })
  @IsOptional()
  @IsDateString()
  smsRequestDate?: Date;
}
