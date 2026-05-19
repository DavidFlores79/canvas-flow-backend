// ABOUTME: REST controller for Workspace CRUD and member management
// ABOUTME: Applies JWT, TenantGuard, and PoliciesGuard for route-level authorization

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

import { WorkspaceService } from '../service/WorkspaceService';
import { CreateWorkspacePayloadDto } from '../dto/CreateWorkspacePayloadDto';
import { UpdateWorkspacePayloadDto } from '../dto/UpdateWorkspacePayloadDto';
import { AddWorkspaceMemberPayloadDto } from '../dto/AddWorkspaceMemberPayloadDto';
import { UpdateWorkspaceMemberRolePayloadDto } from '../dto/UpdateWorkspaceMemberRolePayloadDto';
import { WorkspaceDto } from '../dto/WorkspaceDto';
import { WorkspaceMemberDto } from '../dto/WorkspaceMemberDto';
import { JwtAuthGuard } from '../../auth/guard/JwtAuthGuard';
import { TenantGuard } from '../../casl/guard/TenantGuard';
import { PoliciesGuard } from '../../casl/guard/PoliciesGuard';
import { CheckPolicies } from '../../casl/decorator/CheckPolicies';
import { AppAbility } from '../../casl/factory/AbilityFactory';
import { Workspace } from '../schemas/WorkspaceSchema';
import { WorkspaceMember } from '../schemas/WorkspaceMemberSchema';

interface RequestWithUser extends Request {
  user: { sub: string; organizationId: string };
}

function mapToWorkspaceDto(
  workspace: Workspace & { _id?: unknown; id?: string },
): WorkspaceDto {
  const dto = new WorkspaceDto();
  dto.id =
    (workspace as unknown as { _id: { toString(): string } })._id?.toString() ??
    (workspace as { id?: string }).id ??
    '';
  dto.organizationId = workspace.organizationId?.toString();
  dto.name = workspace.name;
  dto.ownerId = workspace.ownerId?.toString();
  dto.createdAt = workspace.createdAt;
  dto.updatedAt = workspace.updatedAt;
  return dto;
}

function mapToMemberDto(
  member: WorkspaceMember & { _id?: unknown; id?: string },
): WorkspaceMemberDto {
  const dto = new WorkspaceMemberDto();
  dto.id =
    (member as unknown as { _id: { toString(): string } })._id?.toString() ??
    (member as { id?: string }).id ??
    '';
  dto.workspaceId = member.workspaceId?.toString();
  dto.userId = member.userId?.toString();
  dto.role = member.role;
  dto.createdAt = (member as unknown as { createdAt?: Date }).createdAt as Date;
  dto.updatedAt = (member as unknown as { updatedAt?: Date }).updatedAt as Date;
  return dto;
}

@ApiTags('Workspaces')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('create', 'Workspace'))
  @ApiOperation({ operationId: 'createWorkspace', summary: 'Create a new workspace' })
  @ApiCreatedResponse({ description: 'Workspace created', type: WorkspaceDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  async create(
    @Body() dto: CreateWorkspacePayloadDto,
    @Request() req: RequestWithUser,
  ): Promise<WorkspaceDto> {
    const workspace = await this.workspaceService.create(
      dto,
      req.user.organizationId,
      req.user.sub,
    );
    return mapToWorkspaceDto(workspace);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({ operationId: 'findAllWorkspaces', summary: 'Get workspaces for current user in org' })
  @ApiOkResponse({ description: 'List of workspaces', type: [WorkspaceDto] })
  async findAll(@Request() req: RequestWithUser): Promise<WorkspaceDto[]> {
    const workspaces = await this.workspaceService.findAll(
      req.user.organizationId,
      req.user.sub,
    );
    return workspaces.map(mapToWorkspaceDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({ operationId: 'getWorkspaceById', summary: 'Get workspace by ID' })
  @ApiOkResponse({ description: 'Workspace found', type: WorkspaceDto })
  @ApiNotFoundResponse({ description: 'Workspace not found' })
  async getById(@Param('id') id: string): Promise<WorkspaceDto> {
    const workspace = await this.workspaceService.findById(id);
    return mapToWorkspaceDto(workspace);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('update', 'Workspace'))
  @ApiOperation({ operationId: 'updateWorkspace', summary: 'Update a workspace' })
  @ApiOkResponse({ description: 'Workspace updated', type: WorkspaceDto })
  @ApiNotFoundResponse({ description: 'Workspace not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkspacePayloadDto,
  ): Promise<WorkspaceDto> {
    const workspace = await this.workspaceService.update(id, dto);
    return mapToWorkspaceDto(workspace);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('delete', 'Workspace'))
  @ApiOperation({ operationId: 'deleteWorkspace', summary: 'Delete a workspace' })
  @ApiNoContentResponse({ description: 'Workspace deleted' })
  @ApiNotFoundResponse({ description: 'Workspace not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.workspaceService.delete(id);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('invite', 'Organization'))
  @ApiOperation({ operationId: 'addWorkspaceMember', summary: 'Add a member to the workspace' })
  @ApiCreatedResponse({ description: 'Member added', type: WorkspaceMemberDto })
  @ApiConflictResponse({ description: 'User is already a member' })
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddWorkspaceMemberPayloadDto,
  ): Promise<WorkspaceMemberDto> {
    const member = await this.workspaceService.addMember(id, dto);
    return mapToMemberDto(member);
  }

  @Patch(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('invite', 'Organization'))
  @ApiOperation({ operationId: 'updateWorkspaceMemberRole', summary: 'Update a workspace member role' })
  @ApiOkResponse({ description: 'Member role updated', type: WorkspaceMemberDto })
  @ApiNotFoundResponse({ description: 'Member not found' })
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateWorkspaceMemberRolePayloadDto,
  ): Promise<WorkspaceMemberDto> {
    const member = await this.workspaceService.updateMemberRole(id, userId, dto);
    return mapToMemberDto(member);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('invite', 'Organization'))
  @ApiOperation({ operationId: 'removeWorkspaceMember', summary: 'Remove a member from the workspace' })
  @ApiNoContentResponse({ description: 'Member removed' })
  @ApiNotFoundResponse({ description: 'Member not found' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    return this.workspaceService.removeMember(id, userId);
  }
}
