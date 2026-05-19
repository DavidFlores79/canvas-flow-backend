// ABOUTME: DTO for bulk-updating multiple layers in a single request
// ABOUTME: Used during canvas drag/resize to persist multiple layer positions atomically

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkLayerUpdateItemDto {
  @ApiProperty({ description: 'Layer ID to update' })
  @IsMongoId()
  id: string;

  @ApiProperty({ description: 'Updated layer properties' })
  @IsObject()
  properties: Record<string, unknown>;
}

export class BulkUpdateLayersPayloadDto {
  @ApiProperty({ description: 'Array of layer updates', type: [BulkLayerUpdateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkLayerUpdateItemDto)
  layers: BulkLayerUpdateItemDto[];
}
