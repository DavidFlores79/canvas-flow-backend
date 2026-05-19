// ABOUTME: DTO for creating a Leonardo AI image generation job
// ABOUTME: Validates prompt, modelId, and optional canvas dimensions

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  Min,
  Max,
  MinLength,
} from 'class-validator';

export class CreateGenerationPayloadDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  prompt: string;

  @ApiProperty()
  @IsString()
  modelId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(512)
  @Max(1536)
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(512)
  @Max(1536)
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  numImages?: number;
}
