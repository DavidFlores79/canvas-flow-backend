// ABOUTME: DTO for inviting a member to an organization
// ABOUTME: Requires userId and role assignment

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId } from 'class-validator';
import { OrgRole } from '../../shared/enum/OrgRole';

export class InviteMemberPayloadDto {
  @ApiProperty({ description: 'MongoDB ObjectId of the user to invite' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ enum: OrgRole, description: 'Role to assign to the member' })
  @IsEnum(OrgRole)
  role: OrgRole;
}
