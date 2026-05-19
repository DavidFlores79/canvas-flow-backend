// ABOUTME: DTO for the asset transform endpoint
// ABOUTME: All fields are optional — only provided options are applied to the Cloudinary transformation

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsMongoId,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class TransformAssetPayloadDto {
  @ApiProperty({ description: 'Workspace ID where the new transformed asset will be saved' })
  @IsMongoId()
  workspaceId: string;

  @ApiPropertyOptional({ description: 'Remove image background using Cloudinary AI' })
  @IsOptional()
  @IsBoolean()
  removeBackground?: boolean;

  @ApiPropertyOptional({ description: 'Target width in pixels', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({ description: 'Target height in pixels', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;

  @ApiPropertyOptional({
    description: 'Cloudinary crop mode',
    enum: ['fill', 'crop', 'scale', 'fit', 'thumb'],
  })
  @IsOptional()
  @IsIn(['fill', 'crop', 'scale', 'fit', 'thumb'])
  crop?: string;

  @ApiPropertyOptional({ description: 'Brightness adjustment (-100 to 100)', minimum: -100, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(-100)
  @Max(100)
  brightness?: number;

  @ApiPropertyOptional({ description: 'Contrast adjustment (-100 to 100)', minimum: -100, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(-100)
  @Max(100)
  contrast?: number;

  @ApiPropertyOptional({ description: 'Convert image to grayscale' })
  @IsOptional()
  @IsBoolean()
  grayscale?: boolean;

  @ApiPropertyOptional({ description: 'Blur strength (0 to 2000)', minimum: 0, maximum: 2000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2000)
  blur?: number;

  @ApiPropertyOptional({
    description: 'Output format',
    enum: ['jpg', 'png', 'webp', 'avif'],
  })
  @IsOptional()
  @IsIn(['jpg', 'png', 'webp', 'avif'])
  format?: string;
}
