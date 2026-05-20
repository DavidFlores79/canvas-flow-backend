// ABOUTME: DTO for creating a new Layer within a canvas project
// ABOUTME: Validates layer type, optional properties map, and optional asset reference

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsObject, IsMongoId, IsString } from 'class-validator';

export class CreateLayerPayloadDto {
  @ApiProperty({ description: 'Layer type', enum: ['text', 'image', 'shape'] })
  @IsIn(['text', 'image', 'shape'])
  type: string;

  @ApiPropertyOptional({ description: 'Layer properties (position, size, etc.)' })
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Asset ID for image layers' })
  @IsOptional()
  @IsMongoId()
  assetId?: string;

  @ApiPropertyOptional({ description: 'Image URL or text content' })
  @IsOptional()
  @IsString()
  content?: string;
}
