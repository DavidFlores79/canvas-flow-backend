// ABOUTME: DTO for updating a workspace member's role
// ABOUTME: Only the role field is updatable for existing workspace members

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { WorkspaceRole } from '../../shared/enum/WorkspaceRole';

export class UpdateWorkspaceMemberRolePayloadDto {
  @ApiProperty({ enum: WorkspaceRole, description: 'New role for the workspace member' })
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}
