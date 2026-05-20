// ABOUTME: DTO for updating a single Layer document
// ABOUTME: All fields are optional; properties map merged on the service layer

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject, IsIn, IsString, IsMongoId } from 'class-validator';

export class UpdateLayerPayloadDto {
  @ApiPropertyOptional({ description: 'Layer type', enum: ['text', 'image', 'shape'] })
  @IsOptional()
  @IsIn(['text', 'image', 'shape'])
  type?: string;

  @ApiPropertyOptional({ description: 'Layer properties (position, size, etc.)' })
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Image URL or text content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Asset ID for image layers' })
  @IsOptional()
  @IsMongoId()
  assetId?: string;
}
