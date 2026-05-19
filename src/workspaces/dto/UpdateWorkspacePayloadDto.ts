// ABOUTME: DTO for updating a workspace's name
// ABOUTME: All fields optional for partial updates

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateWorkspacePayloadDto {
  @ApiPropertyOptional({ description: 'Display name of the workspace' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;
}
