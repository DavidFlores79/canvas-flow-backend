// ABOUTME: Response DTO for Asset documents
// ABOUTME: Serializes asset data for API responses

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssetDto {
  @ApiProperty() id: string;
  @ApiProperty() organizationId: string;
  @ApiProperty() workspaceId: string;
  @ApiProperty() cloudinaryPublicId: string;
  @ApiProperty() url: string;
  @ApiProperty() type: string;
  @ApiPropertyOptional() metadata?: Record<string, unknown>;
  @ApiPropertyOptional() createdAt: Date;
  @ApiPropertyOptional() updatedAt: Date;
}
