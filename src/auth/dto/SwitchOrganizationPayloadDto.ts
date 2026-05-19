// ABOUTME: DTO for switch-organization request payload
// ABOUTME: Validates the organizationId to switch to

import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SwitchOrganizationPayloadDto {
  @ApiProperty()
  @IsMongoId()
  organizationId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  audience?: string;
}
