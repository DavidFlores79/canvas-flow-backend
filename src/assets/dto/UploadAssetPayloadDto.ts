// ABOUTME: DTO for the multipart upload endpoint form fields
// ABOUTME: The file itself is handled by FileInterceptor; this carries workspace and type

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsIn } from 'class-validator';

export class UploadAssetPayloadDto {
  @ApiProperty({ description: 'Workspace ID this asset belongs to' })
  @IsMongoId()
  workspaceId: string;

  @ApiPropertyOptional({
    description: 'Asset type (defaults to value returned by Cloudinary)',
    enum: ['image', 'video', 'document'],
  })
  @IsOptional()
  @IsIn(['image', 'video', 'document'])
  type?: string;
}
