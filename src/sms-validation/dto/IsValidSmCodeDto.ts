// src/sms/dto/sms-validation.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class IsValidSmsCodeDto {
  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Indicates if the SMS code is valid',
    required: true,
  })
  @IsNotEmpty()
  isValid: boolean;

  static buildDto(payload: boolean): IsValidSmsCodeDto {
    const dto = new IsValidSmsCodeDto();
    dto.isValid = payload;
    return dto;
  }
}
