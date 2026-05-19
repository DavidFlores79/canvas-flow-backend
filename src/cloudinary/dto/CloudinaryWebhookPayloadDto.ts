// ABOUTME: DTO for Cloudinary webhook notification payload
// ABOUTME: Contains notification_type and resource metadata

import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CloudinaryWebhookPayloadDto {
  @ApiProperty()
  @IsString()
  notification_type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;
}
