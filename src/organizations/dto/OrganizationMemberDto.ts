// ABOUTME: Response DTO for OrganizationMember documents
// ABOUTME: Serializes membership data including role for API responses

import { ApiProperty } from '@nestjs/swagger';
import { OrgRole } from '../../shared/enum/OrgRole';

export class OrganizationMemberDto {
  @ApiProperty() id: string;
  @ApiProperty() organizationId: string;
  @ApiProperty() userId: string;
  @ApiProperty({ enum: OrgRole }) role: OrgRole;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
