// ABOUTME: Response DTO for Project documents
// ABOUTME: Serializes project data for API responses

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectDto {
  @ApiProperty() id: string;
  @ApiProperty() organizationId: string;
  @ApiProperty() workspaceId: string;
  @ApiProperty() ownerId: string;
  @ApiProperty() name: string;
  @ApiProperty() width: number;
  @ApiProperty() height: number;
  @ApiProperty() version: number;
  @ApiPropertyOptional() createdAt: Date;
  @ApiPropertyOptional() updatedAt: Date;
}
