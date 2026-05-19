// ABOUTME: REST controller for Organization CRUD and member management
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

import { OrganizationService } from '../service/OrganizationService';
import { CreateOrganizationPayloadDto } from '../dto/CreateOrganizationPayloadDto';
import { UpdateOrganizationPayloadDto } from '../dto/UpdateOrganizationPayloadDto';
import { InviteMemberPayloadDto } from '../dto/InviteMemberPayloadDto';
import { UpdateMemberRolePayloadDto } from '../dto/UpdateMemberRolePayloadDto';
import { OrganizationDto } from '../dto/OrganizationDto';
import { OrganizationMemberDto } from '../dto/OrganizationMemberDto';
import { JwtAuthGuard } from '../../auth/guard/JwtAuthGuard';
import { TenantGuard } from '../../casl/guard/TenantGuard';
import { PoliciesGuard } from '../../casl/guard/PoliciesGuard';
import { CheckPolicies } from '../../casl/decorator/CheckPolicies';
import { AppAbility } from '../../casl/factory/AbilityFactory';
import { Organization } from '../schemas/OrganizationSchema';
import { OrganizationMember } from '../schemas/OrganizationMemberSchema';

interface RequestWithUser extends Request {
  user: { sub: string };
}

function mapToOrganizationDto(org: Organization & { _id?: unknown; id?: string }): OrganizationDto {
  const dto = new OrganizationDto();
  dto.id = (org as unknown as { _id: { toString(): string } })._id?.toString() ?? (org as { id?: string }).id ?? '';
  dto.name = org.name;
  dto.slug = org.slug;
  dto.ownerId = org.ownerId?.toString();
  dto.createdAt = org.createdAt;
  dto.updatedAt = org.updatedAt;
  return dto;
}

function mapToMemberDto(member: OrganizationMember & { _id?: unknown; id?: string }): OrganizationMemberDto {
  const dto = new OrganizationMemberDto();
  dto.id = (member as unknown as { _id: { toString(): string } })._id?.toString() ?? (member as { id?: string }).id ?? '';
  dto.organizationId = member.organizationId?.toString();
  dto.userId = member.userId?.toString();
  dto.role = member.role;
  dto.createdAt = (member as unknown as { createdAt?: Date }).createdAt as Date;
  dto.updatedAt = (member as unknown as { updatedAt?: Date }).updatedAt as Date;
  return dto;
}

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ operationId: 'createOrganization', summary: 'Create a new organization' })
  @ApiCreatedResponse({ description: 'Organization created', type: OrganizationDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiConflictResponse({ description: 'Slug already exists' })
  async create(
    @Body() dto: CreateOrganizationPayloadDto,
    @Request() req: RequestWithUser,
  ): Promise<OrganizationDto> {
    const org = await this.organizationService.create(dto, req.user.sub);
    return mapToOrganizationDto(org);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({ operationId: 'getOrganizationById', summary: 'Get organization by ID' })
  @ApiOkResponse({ description: 'Organization found', type: OrganizationDto })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  async getById(@Param('id') id: string): Promise<OrganizationDto> {
    const org = await this.organizationService.findById(id);
    return mapToOrganizationDto(org);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('update', 'Organization'))
  @ApiOperation({ operationId: 'updateOrganization', summary: 'Update an organization' })
  @ApiOkResponse({ description: 'Organization updated', type: OrganizationDto })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationPayloadDto,
  ): Promise<OrganizationDto> {
    const org = await this.organizationService.update(id, dto);
    return mapToOrganizationDto(org);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('delete', 'Organization'))
  @ApiOperation({ operationId: 'deleteOrganization', summary: 'Delete an organization' })
  @ApiNoContentResponse({ description: 'Organization deleted' })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.organizationService.delete(id);
  }

  @Get(':id/members')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({ operationId: 'getOrganizationMembers', summary: 'Get organization members' })
  @ApiOkResponse({ description: 'List of members', type: [OrganizationMemberDto] })
  async getMembers(@Param('id') id: string): Promise<OrganizationMemberDto[]> {
    const members = await this.organizationService.findMembers(id);
    return members.map(mapToMemberDto);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('invite', 'Organization'))
  @ApiOperation({ operationId: 'inviteOrganizationMember', summary: 'Invite a member to the organization' })
  @ApiCreatedResponse({ description: 'Member invited', type: OrganizationMemberDto })
  @ApiConflictResponse({ description: 'User is already a member' })
  async inviteMember(
    @Param('id') id: string,
    @Body() dto: InviteMemberPayloadDto,
  ): Promise<OrganizationMemberDto> {
    const member = await this.organizationService.inviteMember(id, dto);
    return mapToMemberDto(member);
  }

  @Patch(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('invite', 'Organization'))
  @ApiOperation({ operationId: 'updateOrganizationMemberRole', summary: 'Update a member role' })
  @ApiOkResponse({ description: 'Member role updated', type: OrganizationMemberDto })
  @ApiNotFoundResponse({ description: 'Member not found' })
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRolePayloadDto,
  ): Promise<OrganizationMemberDto> {
    const member = await this.organizationService.updateMemberRole(id, userId, dto);
    return mapToMemberDto(member);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, TenantGuard, PoliciesGuard)
  @CheckPolicies((a: AppAbility) => a.can('invite', 'Organization'))
  @ApiOperation({ operationId: 'removeOrganizationMember', summary: 'Remove a member from the organization' })
  @ApiNoContentResponse({ description: 'Member removed' })
  @ApiNotFoundResponse({ description: 'Member not found' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    return this.organizationService.removeMember(id, userId);
  }
}
