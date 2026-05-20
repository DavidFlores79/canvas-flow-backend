// ABOUTME: Response DTO for Layer documents
// ABOUTME: Serializes layer data for API responses

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LayerDto {
  @ApiProperty() id: string;
  @ApiProperty() projectId: string;
  @ApiProperty() organizationId: string;
  @ApiPropertyOptional() assetId?: string;
  @ApiProperty() type: string;
  @ApiPropertyOptional() content?: string;
  @ApiPropertyOptional() properties?: Record<string, unknown>;
  @ApiPropertyOptional() createdAt: Date;
  @ApiPropertyOptional() updatedAt: Date;
}
