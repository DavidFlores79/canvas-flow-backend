// ABOUTME: REST controller for Asset CRUD operations
// ABOUTME: Applies JWT, TenantGuard, and PoliciesGuard for route-level authorization

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { AssetService } from '../service/AssetService';
import { CreateAssetPayloadDto } from '../dto/CreateAssetPayloadDto';
import { FilterAssetsQueryDto } from '../dto/FilterAssetsQueryDto';
import { AssetDto } from '../dto/AssetDto';
import { JwtAuthGuard } from '../../auth/guard/JwtAuthGuard';
import { TenantGuard } from '../../casl/guard/TenantGuard';
import { PoliciesGuard } from '../../casl/guard/PoliciesGuard';
import { CheckPolicies } from '../../casl/decorator/CheckPolicies';
import { AppAbility } from '../../casl/factory/AbilityFactory';
import { Asset } from '../schemas/AssetSchema';

interface RequestWithUser extends Request {
  user: { sub: string; organizationId: string };
}

function mapToAssetDto(asset: Asset & { _id?: unknown; id?: string }): AssetDto {
  const dto = new AssetDto();
  dto.id = (asset as unknown as { _id: { toString(): string } })._id?.toString() ?? (asset as { id?: string }).id ?? '';
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

@ApiTags('Assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('create', 'Asset'))
  @ApiOperation({ operationId: 'createAsset', summary: 'Register a new asset after Cloudinary upload' })
  @ApiCreatedResponse({ description: 'Asset created', type: AssetDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  async create(
    @Body() dto: CreateAssetPayloadDto,
    @Request() req: RequestWithUser,
  ): Promise<AssetDto> {
    const asset = await this.assetService.create(dto, req.user.organizationId);
    return mapToAssetDto(asset);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({ operationId: 'getAssets', summary: 'List assets for the active organization' })
  @ApiOkResponse({ description: 'List of assets', type: [AssetDto] })
  async findAll(
    @Query() query: FilterAssetsQueryDto,
    @Request() req: RequestWithUser,
  ): Promise<AssetDto[]> {
    const assets = await this.assetService.findAll(req.user.organizationId, query);
    return assets.map(mapToAssetDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({ operationId: 'getAssetById', summary: 'Get an asset by ID' })
  @ApiOkResponse({ description: 'Asset found', type: AssetDto })
  @ApiNotFoundResponse({ description: 'Asset not found' })
  async getById(@Param('id') id: string): Promise<AssetDto> {
    const asset = await this.assetService.findById(id);
    return mapToAssetDto(asset);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('delete', 'Asset'))
  @ApiOperation({ operationId: 'deleteAsset', summary: 'Delete an asset' })
  @ApiNoContentResponse({ description: 'Asset deleted' })
  @ApiNotFoundResponse({ description: 'Asset not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.assetService.delete(id);
  }
}
