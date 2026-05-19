// ABOUTME: Response DTO for Organization documents
// ABOUTME: Serializes organization data for API responses

import { ApiProperty } from '@nestjs/swagger';

export class OrganizationDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() slug: string;
  @ApiProperty() ownerId: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
