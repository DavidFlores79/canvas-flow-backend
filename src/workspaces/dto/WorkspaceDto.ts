// ABOUTME: Response DTO for Workspace documents
// ABOUTME: Serializes workspace data for API responses

import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceDto {
  @ApiProperty() id: string;
  @ApiProperty() organizationId: string;
  @ApiProperty() name: string;
  @ApiProperty() ownerId: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
