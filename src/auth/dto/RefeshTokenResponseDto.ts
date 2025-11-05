import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Allow } from 'class-validator';

export class RefreshTokenResponseDto {
  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Allow()
  accessToken: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Allow()
  refreshToken: string;
}
