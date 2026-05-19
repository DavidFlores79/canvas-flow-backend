// ABOUTME: DTO for creating a new Asset record after a Cloudinary upload
// ABOUTME: Validates Cloudinary identifiers, URL, asset type, and optional metadata

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsString, IsNotEmpty, IsUrl, IsIn, IsOptional, IsObject } from 'class-validator';

export class CreateAssetPayloadDto {
  @ApiProperty({ description: 'Workspace ID this asset belongs to' })
  @IsMongoId()
  workspaceId: string;

  @ApiProperty({ description: 'Cloudinary public ID of the uploaded file' })
  @IsString()
  @IsNotEmpty()
  cloudinaryPublicId: string;

  @ApiProperty({ description: 'Public URL from Cloudinary' })
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Asset type', enum: ['image', 'video', 'document'] })
  @IsIn(['image', 'video', 'document'])
  type: string;

  @ApiPropertyOptional({ description: 'Additional metadata (dimensions, duration, etc.)' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
