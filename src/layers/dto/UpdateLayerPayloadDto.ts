// ABOUTME: DTO for updating a single Layer document
// ABOUTME: All fields are optional; properties map merged on the service layer

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject, IsIn } from 'class-validator';

export class UpdateLayerPayloadDto {
  @ApiPropertyOptional({ description: 'Layer type', enum: ['text', 'image', 'shape'] })
  @IsOptional()
  @IsIn(['text', 'image', 'shape'])
  type?: string;

  @ApiPropertyOptional({ description: 'Layer properties (position, size, content, etc.)' })
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;
}
