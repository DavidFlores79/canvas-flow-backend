// ABOUTME: REST controller for Project CRUD operations on canvas projects
// ABOUTME: Applies JWT, TenantGuard, and PoliciesGuard for route-level authorization

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
  ApiConflictResponse,
} from '@nestjs/swagger';

import { ProjectService } from '../service/ProjectService';
import { CreateProjectPayloadDto } from '../dto/CreateProjectPayloadDto';
import { UpdateProjectPayloadDto } from '../dto/UpdateProjectPayloadDto';
import { FilterProjectsQueryDto } from '../dto/FilterProjectsQueryDto';
import { ProjectDto } from '../dto/ProjectDto';
import { JwtAuthGuard } from '../../auth/guard/JwtAuthGuard';
import { TenantGuard } from '../../casl/guard/TenantGuard';
import { PoliciesGuard } from '../../casl/guard/PoliciesGuard';
import { CheckPolicies } from '../../casl/decorator/CheckPolicies';
import { AppAbility } from '../../casl/factory/AbilityFactory';
import { Project } from '../schemas/ProjectSchema';

interface RequestWithUser extends Request {
  user: { sub: string; organizationId: string };
}

function mapToProjectDto(project: Project & { _id?: unknown; id?: string }): ProjectDto {
  const dto = new ProjectDto();
  dto.id = (project as unknown as { _id: { toString(): string } })._id?.toString() ?? (project as { id?: string }).id ?? '';
  dto.organizationId = project.organizationId?.toString();
  dto.workspaceId = project.workspaceId?.toString();
  dto.ownerId = project.ownerId?.toString();
  dto.name = project.name;
  dto.width = project.width;
  dto.height = project.height;
  dto.version = project.version;
  dto.createdAt = project.createdAt;
  dto.updatedAt = project.updatedAt;
  return dto;
}

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('create', 'Project'))
  @ApiOperation({ operationId: 'createProject', summary: 'Create a new canvas project' })
  @ApiCreatedResponse({ description: 'Project created', type: ProjectDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  async create(
    @Body() dto: CreateProjectPayloadDto,
    @Request() req: RequestWithUser,
  ): Promise<ProjectDto> {
    const project = await this.projectService.create(dto, req.user.organizationId, req.user.sub);
    return mapToProjectDto(project);
  }

  @Get()
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({ operationId: 'getProjects', summary: 'List projects in a workspace' })
  @ApiOkResponse({ description: 'List of projects', type: [ProjectDto] })
  async findAll(@Query() query: FilterProjectsQueryDto): Promise<ProjectDto[]> {
    const projects = await this.projectService.findAll(query);
    return projects.map(mapToProjectDto);
  }

  @Get(':id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({ operationId: 'getProjectById', summary: 'Get a project by ID' })
  @ApiOkResponse({ description: 'Project found', type: ProjectDto })
  @ApiNotFoundResponse({ description: 'Project not found' })
  async getById(@Param('id') id: string): Promise<ProjectDto> {
    const project = await this.projectService.findById(id);
    return mapToProjectDto(project);
  }

  @Patch(':id')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('update', 'Project'))
  @ApiOperation({ operationId: 'updateProject', summary: 'Update a project' })
  @ApiOkResponse({ description: 'Project updated', type: ProjectDto })
  @ApiNotFoundResponse({ description: 'Project not found' })
  @ApiConflictResponse({ description: 'Version conflict — project was modified by another client' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectPayloadDto,
  ): Promise<ProjectDto> {
    const project = await this.projectService.update(id, dto);
    return mapToProjectDto(project);
  }

  @Delete(':id')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('delete', 'Project'))
  @ApiOperation({ operationId: 'deleteProject', summary: 'Delete a project' })
  @ApiNoContentResponse({ description: 'Project deleted' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.projectService.delete(id);
  }
}
