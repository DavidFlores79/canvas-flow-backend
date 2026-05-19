// ABOUTME: DTO for creating a new Project document
// ABOUTME: Validates canvas name, workspaceId, and optional width/height dimensions

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsMongoId, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateProjectPayloadDto {
  @ApiProperty({ description: 'Project name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Workspace ID this project belongs to' })
  @IsMongoId()
  workspaceId: string;

  @ApiPropertyOptional({ description: 'Canvas width in pixels', default: 800 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({ description: 'Canvas height in pixels', default: 600 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  height?: number;
}
