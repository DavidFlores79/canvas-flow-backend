import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Allow } from 'class-validator';

export class ValidateJwtPayloadDto {
  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Allow()
  jwt: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Allow()
  audience: string;
}
