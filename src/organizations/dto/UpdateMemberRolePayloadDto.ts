// ABOUTME: DTO for updating an organization member's role
// ABOUTME: Only the role field is updatable for existing members

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrgRole } from '../../shared/enum/OrgRole';

export class UpdateMemberRolePayloadDto {
  @ApiProperty({ enum: OrgRole, description: 'New role for the member' })
  @IsEnum(OrgRole)
  role: OrgRole;
}
