import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateSmsValidationPayloadDto } from './CreateSmsValidationPayloadDto';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class UpdateSmsValidationPayloadDto extends PartialType(
  CreateSmsValidationPayloadDto,
) {
  @ApiProperty({ type: Date, required: true })
  @IsNotEmpty()
  @IsDateString()
  updatedAt: string;
}
