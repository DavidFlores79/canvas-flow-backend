// ABOUTME: Response DTO for the AI image generation endpoint
// ABOUTME: Returns one AssetDto per generated image (up to numImages assets)

import { ApiProperty } from '@nestjs/swagger';
import { AssetDto } from '../../assets/dto/AssetDto';

export class AiGenerateResultDto {
  @ApiProperty({ type: [AssetDto], description: 'Generated images saved as Assets' })
  assets: AssetDto[];
}
