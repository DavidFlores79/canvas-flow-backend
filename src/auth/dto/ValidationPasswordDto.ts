import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsBoolean } from 'class-validator';

export class ValidationPasswordDto {
  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  @Allow()
  isValid: boolean;
}
