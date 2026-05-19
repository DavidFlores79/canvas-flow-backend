// ABOUTME: DTO for creating a new workspace
// ABOUTME: Validates the workspace name; organizationId comes from JWT context

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateWorkspacePayloadDto {
  @ApiProperty({ description: 'Display name of the workspace' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}
