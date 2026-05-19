// ABOUTME: DTO for updating an organization's name or slug
// ABOUTME: All fields optional for partial updates

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class UpdateOrganizationPayloadDto {
  @ApiPropertyOptional({ description: 'Display name of the organization' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug (lowercase, hyphens allowed)' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase alphanumeric with hyphens' })
  @MinLength(2)
  @MaxLength(50)
  slug?: string;
}
