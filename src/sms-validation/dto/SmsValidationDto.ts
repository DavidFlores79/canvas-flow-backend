// src/sms/dto/sms-validation.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Status } from '../../users/enum/UserEnum';
import { SmsValidationAction } from '../enum/SmsValidationAction';
import { SmsValidationStatus } from '../enum/SmsValidationStatus';
import { SmsValidation } from '../schemas/SmsValidationSchema';
import { IsNotEmpty } from 'class-validator';

export class SmsValidationDto {
  @ApiProperty({ type: String, example: 'uuid-generated-id' })
  id: string;

  @ApiProperty({
    type: String,
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ type: String, example: '+52559991992696', required: true })
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ type: String, example: 'twilio', required: true })
  @IsNotEmpty()
  smsProvider: string;

  @ApiProperty({
    type: String,
    enum: Status,
    example: 'created',
    required: false,
  })
  status?: string;

  @ApiProperty({
    type: String,
    example: 'VEXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    required: false,
  })
  smsServiceSid?: string;

  @ApiProperty({
    type: String,
    example: 'VAXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    required: false,
  })
  smsRequestSid?: string;

  @ApiProperty({
    type: String,
    example: 'confirm_sign_up',
    enum: SmsValidationAction,
    required: false,
  })
  smsAction?: string;

  @ApiProperty({
    type: String,
    example: 'pending',
    enum: SmsValidationStatus,
    required: false,
  })
  smsStatus?: string;

  @ApiProperty({
    type: Date,
    example: new Date().toISOString(),
    required: false,
  })
  smsRequestDate?: Date;

  @ApiProperty({ type: Date, example: new Date().toISOString() })
  createdAt: Date;

  @ApiProperty({ type: Date, example: new Date().toISOString() })
  updatedAt: Date;

  static buildDto(smsValidation: SmsValidation): SmsValidationDto {
    const dto = new SmsValidationDto();
    dto.id = smsValidation.id;
    dto.phone = smsValidation.phone!;
    dto.smsProvider = smsValidation.smsProvider as string;
    dto.status = smsValidation.status;
    dto.smsServiceSid = smsValidation.smsServiceSid;
    dto.smsRequestSid = smsValidation.smsRequestSid;
    dto.smsAction = smsValidation.smsAction;
    dto.smsStatus = smsValidation.smsStatus;
    dto.smsRequestDate = smsValidation.smsRequestDate;
    dto.createdAt = smsValidation.createdAt;
    dto.updatedAt = smsValidation.updatedAt;
    return dto;
  }
}
