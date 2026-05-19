// ABOUTME: Service for Workspace CRUD and member management operations
// ABOUTME: Handles business logic for multi-tenant workspace and membership data

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Workspace, WorkspaceDocument } from '../schemas/WorkspaceSchema';
import { WorkspaceMember, WorkspaceMemberDocument } from '../schemas/WorkspaceMemberSchema';
import { CreateWorkspacePayloadDto } from '../dto/CreateWorkspacePayloadDto';
import { UpdateWorkspacePayloadDto } from '../dto/UpdateWorkspacePayloadDto';
import { AddWorkspaceMemberPayloadDto } from '../dto/AddWorkspaceMemberPayloadDto';
import { UpdateWorkspaceMemberRolePayloadDto } from '../dto/UpdateWorkspaceMemberRolePayloadDto';
import { DuplicateEntityError } from '../../shared/error/DuplicateEntityError';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';
import { WorkspaceRole } from '../../shared/enum/WorkspaceRole';

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(
    @InjectModel(Workspace.name)
    private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(WorkspaceMember.name)
    private readonly memberModel: Model<WorkspaceMemberDocument>,
  ) {}

  async create(
    dto: CreateWorkspacePayloadDto,
    organizationId: string,
    ownerId: string,
  ): Promise<Workspace> {
    this.logger.log(`Creating workspace "${dto.name}" in org: ${organizationId}`);

    const workspace = new this.workspaceModel({
      ...dto,
      organizationId: new Types.ObjectId(organizationId),
      ownerId: new Types.ObjectId(ownerId),
    });

    const savedWorkspace = await workspace.save();

    // Assign creator as workspace owner
    const member = new this.memberModel({
      workspaceId: savedWorkspace._id,
      userId: new Types.ObjectId(ownerId),
      role: WorkspaceRole.Owner,
    });
    await member.save();

    this.logger.log(`Workspace created successfully: ${savedWorkspace.id}`);
    return savedWorkspace;
  }

  async findAll(organizationId: string, userId: string): Promise<Workspace[]> {
    this.logger.debug(`Finding workspaces for user ${userId} in org: ${organizationId}`);

    // Find all workspace IDs where the user is a member
    const memberships = await this.memberModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('workspaceId')
      .exec();

    const workspaceIds = memberships.map((m) => m.workspaceId);

    return this.workspaceModel
      .find({
        organizationId: new Types.ObjectId(organizationId),
        _id: { $in: workspaceIds },
      })
      .exec();
  }

  async findById(id: string): Promise<Workspace> {
    this.logger.debug(`Finding workspace by id: ${id}`);
    const workspace = await this.workspaceModel.findById(id).exec();

    if (!workspace) {
      this.logger.warn(`Workspace not found: ${id}`);
      throw new NotFoundEntityError('Workspace not found', 'Workspace', '404');
    }

    return workspace;
  }

  async update(id: string, dto: UpdateWorkspacePayloadDto): Promise<Workspace> {
    this.logger.log(`Updating workspace: ${id}`);
    const workspace = await this.workspaceModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();

    if (!workspace) {
      this.logger.warn(`Workspace not found for update: ${id}`);
      throw new NotFoundEntityError('Workspace not found', 'Workspace', '404');
    }

    this.logger.log(`Workspace updated successfully: ${id}`);
    return workspace;
  }

  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting workspace: ${id}`);
    const result = await this.workspaceModel.findByIdAndDelete(id).exec();

    if (!result) {
      this.logger.warn(`Workspace not found for deletion: ${id}`);
      throw new NotFoundEntityError('Workspace not found', 'Workspace', '404');
    }

    this.logger.log(`Workspace deleted successfully: ${id}`);
  }

  async addMember(
    workspaceId: string,
    dto: AddWorkspaceMemberPayloadDto,
  ): Promise<WorkspaceMember> {
    this.logger.log(`Adding member ${dto.userId} to workspace: ${workspaceId}`);

    const member = new this.memberModel({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(dto.userId),
      role: dto.role,
    });

    try {
      return await member.save();
    } catch (error: unknown) {
      if ((error as { code?: number }).code === 11000) {
        throw new DuplicateEntityError(
          'User is already a member of this workspace',
          'WorkspaceMember',
          '11000',
        );
      }
      throw error;
    }
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    dto: UpdateWorkspaceMemberRolePayloadDto,
  ): Promise<WorkspaceMember> {
    this.logger.log(`Updating role for member ${userId} in workspace: ${workspaceId}`);

    const member = await this.memberModel
      .findOneAndUpdate(
        {
          workspaceId: new Types.ObjectId(workspaceId),
          userId: new Types.ObjectId(userId),
        },
        { $set: { role: dto.role } },
        { new: true },
      )
      .exec();

    if (!member) {
      this.logger.warn(`Member not found: userId=${userId}, workspaceId=${workspaceId}`);
      throw new NotFoundEntityError(
        'Workspace member not found',
        'WorkspaceMember',
        '404',
      );
    }

    this.logger.log(`Workspace member role updated successfully`);
    return member;
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    this.logger.log(`Removing member ${userId} from workspace: ${workspaceId}`);

    const result = await this.memberModel
      .findOneAndDelete({
        workspaceId: new Types.ObjectId(workspaceId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (!result) {
      this.logger.warn(`Member not found for removal: userId=${userId}, workspaceId=${workspaceId}`);
      throw new NotFoundEntityError(
        'Workspace member not found',
        'WorkspaceMember',
        '404',
      );
    }

    this.logger.log(`Workspace member removed successfully`);
  }
}
