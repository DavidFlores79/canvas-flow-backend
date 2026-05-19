// ABOUTME: REST controller for Layer CRUD and bulk-update operations
// ABOUTME: Endpoints nested under /projects/:projectId/layers with CASL authorization

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Version,
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

import { LayerService } from '../service/LayerService';
import { CreateLayerPayloadDto } from '../dto/CreateLayerPayloadDto';
import { UpdateLayerPayloadDto } from '../dto/UpdateLayerPayloadDto';
import { BulkUpdateLayersPayloadDto } from '../dto/BulkUpdateLayersPayloadDto';
import { LayerDto } from '../dto/LayerDto';
import { JwtAuthGuard } from '../../auth/guard/JwtAuthGuard';
import { TenantGuard } from '../../casl/guard/TenantGuard';
import { PoliciesGuard } from '../../casl/guard/PoliciesGuard';
import { CheckPolicies } from '../../casl/decorator/CheckPolicies';
import { AppAbility } from '../../casl/factory/AbilityFactory';
import { Layer } from '../schemas/LayerSchema';

interface RequestWithUser extends Request {
  user: { sub: string; organizationId: string };
}

function mapToLayerDto(layer: Layer & { _id?: unknown; id?: string }): LayerDto {
  const dto = new LayerDto();
  dto.id = (layer as unknown as { _id: { toString(): string } })._id?.toString() ?? (layer as { id?: string }).id ?? '';
  dto.projectId = layer.projectId?.toString();
  dto.organizationId = layer.organizationId?.toString();
  dto.assetId = layer.assetId?.toString();
  dto.type = layer.type;
  dto.properties = layer.properties as unknown as Record<string, unknown>;
  dto.createdAt = layer.createdAt;
  dto.updatedAt = layer.updatedAt;
  return dto;
}

@ApiTags('Layers')
@ApiBearerAuth()
@Controller('projects/:projectId/layers')
export class LayerController {
  constructor(private readonly layerService: LayerService) {}

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('create', 'Layer'))
  @ApiOperation({ operationId: 'createLayer', summary: 'Create a new layer in a project' })
  @ApiCreatedResponse({ description: 'Layer created', type: LayerDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateLayerPayloadDto,
    @Request() req: RequestWithUser,
  ): Promise<LayerDto> {
    const layer = await this.layerService.create(dto, projectId, req.user.organizationId);
    return mapToLayerDto(layer);
  }

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({ operationId: 'getLayers', summary: 'List all layers in a project' })
  @ApiOkResponse({ description: 'List of layers', type: [LayerDto] })
  async findAll(@Param('projectId') projectId: string): Promise<LayerDto[]> {
    const layers = await this.layerService.findAll(projectId);
    return layers.map(mapToLayerDto);
  }

  @Patch('bulk')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('update', 'Layer'))
  @ApiOperation({ operationId: 'bulkUpdateLayers', summary: 'Bulk update layer properties (canvas drag/resize)' })
  @ApiOkResponse({ description: 'Updated layers', type: [LayerDto] })
  @ApiNotFoundResponse({ description: 'One or more layers not found' })
  async bulkUpdate(
    @Param('projectId') projectId: string,
    @Body() dto: BulkUpdateLayersPayloadDto,
  ): Promise<LayerDto[]> {
    const layers = await this.layerService.bulkUpdate(projectId, dto);
    return layers.map(mapToLayerDto);
  }

  @Patch(':id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('update', 'Layer'))
  @ApiOperation({ operationId: 'updateLayer', summary: 'Update a layer' })
  @ApiOkResponse({ description: 'Layer updated', type: LayerDto })
  @ApiNotFoundResponse({ description: 'Layer not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLayerPayloadDto,
  ): Promise<LayerDto> {
    const layer = await this.layerService.update(id, dto);
    return mapToLayerDto(layer);
  }

  @Delete(':id')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('delete', 'Layer'))
  @ApiOperation({ operationId: 'deleteLayer', summary: 'Delete a layer' })
  @ApiNoContentResponse({ description: 'Layer deleted' })
  @ApiNotFoundResponse({ description: 'Layer not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.layerService.delete(id);
  }
}
