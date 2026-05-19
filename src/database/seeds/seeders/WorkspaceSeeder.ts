// ABOUTME: Seeds default workspaces for each seed organization
// ABOUTME: Idempotent — checks by organizationId+name before inserting

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Workspace, WorkspaceDocument } from '../../../workspaces/schemas/WorkspaceSchema';
import { WorkspaceMember, WorkspaceMemberDocument } from '../../../workspaces/schemas/WorkspaceMemberSchema';
import { WorkspaceRole } from '../../../shared/enum/WorkspaceRole';
import { SeedUserResult } from './UserSeeder';
import { SeedOrganizationResult } from './OrganizationSeeder';

@Injectable()
export class WorkspaceSeeder {
  private readonly logger = new Logger(WorkspaceSeeder.name);

  constructor(
    @InjectModel(Workspace.name)
    private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(WorkspaceMember.name)
    private readonly workspaceMemberModel: Model<WorkspaceMemberDocument>,
  ) {}

  async seed(users: SeedUserResult, orgs: SeedOrganizationResult): Promise<void> {
    await this.seedWorkspace(
      {
        name: 'Default',
        organizationId: orgs.paisamexOrg._id as Types.ObjectId,
        ownerId: users.paisamexUser._id as Types.ObjectId,
      },
    );

    await this.seedWorkspace(
      {
        name: 'Default',
        organizationId: orgs.luxfreeOrg._id as Types.ObjectId,
        ownerId: users.luxfreeUser._id as Types.ObjectId,
      },
    );
  }

  private async seedWorkspace(data: {
    name: string;
    organizationId: Types.ObjectId;
    ownerId: Types.ObjectId;
  }): Promise<void> {
    const existing = await this.workspaceModel
      .findOne({ organizationId: data.organizationId, name: data.name })
      .exec();

    let workspace: WorkspaceDocument;

    if (existing) {
      this.logger.log(
        `Workspace already exists, skipping: org=${data.organizationId} name=${data.name}`,
      );
      workspace = existing;
    } else {
      const created = new this.workspaceModel({
        name: data.name,
        organizationId: data.organizationId,
        ownerId: data.ownerId,
      });

      workspace = await created.save();
      this.logger.log(
        `Created workspace: org=${data.organizationId} name=${data.name}`,
      );
    }

    await this.seedMembership(workspace._id as Types.ObjectId, data.ownerId);
  }

  private async seedMembership(
    workspaceId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<void> {
    const existing = await this.workspaceMemberModel
      .findOne({ workspaceId, userId })
      .exec();

    if (existing) {
      this.logger.log(
        `WorkspaceMember already exists, skipping: workspace=${workspaceId} user=${userId}`,
      );
      return;
    }

    const member = new this.workspaceMemberModel({
      workspaceId,
      userId,
      role: WorkspaceRole.Owner,
    });

    await member.save();
    this.logger.log(
      `Created WorkspaceMember: workspace=${workspaceId} user=${userId} role=${WorkspaceRole.Owner}`,
    );
  }
}
