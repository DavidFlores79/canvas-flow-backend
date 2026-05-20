import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Allow, IsOptional } from 'class-validator';

export class RefreshTokenPayloadDto {
  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Allow()
  refreshToken: string;

  @ApiPropertyOptional({ type: String, required: false })
  @IsOptional()
  @IsString()
  @Allow()
  audience?: string;
}
