// ABOUTME: DTO for the AI image generation endpoint
// ABOUTME: Validates Leonardo generation parameters and the workspace to save results into

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class AiGeneratePayloadDto {
  @ApiProperty({ description: 'Text prompt describing the image to generate' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({ description: 'Leonardo AI model ID to use for generation' })
  @IsString()
  @IsNotEmpty()
  modelId: string;

  @ApiProperty({ description: 'Workspace ID where generated Asset records will be saved' })
  @IsMongoId()
  workspaceId: string;

  @ApiPropertyOptional({ description: 'Image width in pixels (32–1536)', minimum: 32, maximum: 1536 })
  @IsOptional()
  @IsInt()
  @Min(32)
  @Max(1536)
  width?: number;

  @ApiPropertyOptional({ description: 'Image height in pixels (32–1536)', minimum: 32, maximum: 1536 })
  @IsOptional()
  @IsInt()
  @Min(32)
  @Max(1536)
  height?: number;

  @ApiPropertyOptional({ description: 'Number of images to generate (1–4)', minimum: 1, maximum: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  numImages?: number;
}
