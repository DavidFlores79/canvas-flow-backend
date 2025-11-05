import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Allow, IsPhoneNumber } from 'class-validator';

export class RecoverPasswordPayloadDto {
  @ApiProperty({ type: String, required: true })
  @IsPhoneNumber()
  @IsNotEmpty()
  @Allow()
  phone: string;
}
