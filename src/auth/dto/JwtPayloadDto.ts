// ABOUTME: DTO representing the decoded JWT payload for Swagger documentation
// ABOUTME: Reflects the JwtPayload interface fields including org context

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Allow } from 'class-validator';

export class JwtPayloadDto {
  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Allow()
  sub: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @Allow()
  organizationId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @Allow()
  orgRole?: string;

  @ApiProperty({ type: Number, required: true })
  @IsNotEmpty()
  @Allow()
  iat: number;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Allow()
  aud: string;

  @ApiProperty({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Allow()
  iss: string;
}
