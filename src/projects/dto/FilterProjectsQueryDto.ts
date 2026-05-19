// ABOUTME: DTO for filtering projects by workspace with optional pagination
// ABOUTME: workspaceId is required to enforce tenant-scoped queries

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterProjectsQueryDto {
  @ApiProperty({ description: 'Workspace ID to filter projects by' })
  @IsMongoId()
  workspaceId: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
