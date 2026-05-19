// ABOUTME: DTO for filtering assets with optional workspace scoping and pagination
// ABOUTME: Organization scope is enforced by the service from the JWT claims

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterAssetsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by workspace ID' })
  @IsOptional()
  @IsMongoId()
  workspaceId?: string;

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
