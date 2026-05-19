// ABOUTME: Response DTO for WorkspaceMember documents
// ABOUTME: Serializes workspace membership data including role for API responses

import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '../../shared/enum/WorkspaceRole';

export class WorkspaceMemberDto {
  @ApiProperty() id: string;
  @ApiProperty() workspaceId: string;
  @ApiProperty() userId: string;
  @ApiProperty({ enum: WorkspaceRole }) role: WorkspaceRole;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
