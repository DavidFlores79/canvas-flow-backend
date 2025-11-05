import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Allow } from 'class-validator';

export class ValidateUserPasswordPayloadDto {
  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Allow()
  password: string;
}
