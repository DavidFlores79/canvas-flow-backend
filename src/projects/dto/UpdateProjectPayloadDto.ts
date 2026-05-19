// ABOUTME: DTO for updating an existing Project document
// ABOUTME: Version is required for optimistic locking; name and dimensions are optional

import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class UpdateProjectPayloadDto {
  @ApiPropertyOptional({ description: 'Project name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Canvas width in pixels' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({ description: 'Canvas height in pixels' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  height?: number;

  @ApiProperty({ description: 'Current version for optimistic locking check' })
  @IsNumber()
  version: number;
}
