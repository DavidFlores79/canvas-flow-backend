// ABOUTME: DTO for adding a member to a workspace
// ABOUTME: Requires userId and workspace role assignment

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId } from 'class-validator';
import { WorkspaceRole } from '../../shared/enum/WorkspaceRole';

export class AddWorkspaceMemberPayloadDto {
  @ApiProperty({ description: 'MongoDB ObjectId of the user to add' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ enum: WorkspaceRole, description: 'Role to assign to the member' })
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}
