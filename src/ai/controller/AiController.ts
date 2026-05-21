// ABOUTME: REST controller for AI image generation via Leonardo + Cloudinary
// ABOUTME: POST /ai/generate — synchronous polling, returns Asset array on completion

import {
  Controller,
  Post,
  Version,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { AiService } from '../service/AiService';
import { AiGeneratePayloadDto } from '../dto/AiGeneratePayloadDto';
import { AiGenerateResultDto } from '../dto/AiGenerateResultDto';
import { AssetDto } from '../../assets/dto/AssetDto';
import { JwtAuthGuard } from '../../auth/guard/JwtAuthGuard';
import { TenantGuard } from '../../casl/guard/TenantGuard';
import { Asset } from '../../assets/schemas/AssetSchema';

interface RequestWithUser extends Request {
  user: { sub: string; organizationId: string };
}

function mapToAssetDto(
  asset: Asset & { _id?: unknown; id?: string },
): AssetDto {
  const dto = new AssetDto();
  dto.id =
    (asset as unknown as { _id: { toString(): string } })._id?.toString() ??
    (asset as { id?: string }).id ??
    '';
  dto.organizationId = asset.organizationId?.toString();
  dto.workspaceId = asset.workspaceId?.toString();
  dto.cloudinaryPublicId = asset.cloudinaryPublicId;
  dto.url = asset.url;
  dto.type = asset.type;
  dto.metadata = asset.metadata as unknown as Record<string, unknown>;
  dto.createdAt = asset.createdAt;
  dto.updatedAt = asset.updatedAt;
  return dto;
}

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Version('1')
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({
    operationId: 'aiGenerate',
    summary:
      'Generate images with Leonardo AI and save to Cloudinary as Assets',
    description:
      'Synchronous — server polls Leonardo for up to 60 seconds. Frontend should display a loading state.',
  })
  @ApiCreatedResponse({
    description: 'Images generated and saved as Assets',
    type: AiGenerateResultDto,
  })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiUnprocessableEntityResponse({
    description: 'Generation failed or timed out',
  })
  async generate(
    @Body() dto: AiGeneratePayloadDto,
    @Request() req: RequestWithUser,
  ): Promise<AiGenerateResultDto> {
    const assets = await this.aiService.generate(dto, req.user.organizationId);
    return { assets: assets.map(mapToAssetDto) };
  }
}
