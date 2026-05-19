// ABOUTME: DTO for creating a new organization
// ABOUTME: Validates name and slug inputs

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateOrganizationPayloadDto {
  @ApiProperty({ description: 'Display name of the organization' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'URL-friendly slug (lowercase, hyphens allowed)' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase alphanumeric with hyphens' })
  @MinLength(2)
  @MaxLength(50)
  slug: string;
}
