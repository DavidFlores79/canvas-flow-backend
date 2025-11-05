import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Allow } from 'class-validator';

export class RefreshTokenPayloadDto {
  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Allow()
  refreshToken: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Allow()
  audience: string;
}
