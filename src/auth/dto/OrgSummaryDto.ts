// ABOUTME: Lightweight org summary returned in sign-in response
// ABOUTME: Gives the frontend all orgs the user belongs to with their role

import { ApiProperty } from '@nestjs/swagger';

export class OrgSummaryDto {
  @ApiProperty({ description: 'Organization ID' })
  id: string;

  @ApiProperty({ description: 'User role in this organization' })
  role: string;
}
