// ABOUTME: Service for Organization CRUD and member management operations
// ABOUTME: Handles business logic for multi-tenant organization and membership data

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Organization, OrganizationDocument } from '../schemas/OrganizationSchema';
import { OrganizationMember, OrganizationMemberDocument } from '../schemas/OrganizationMemberSchema';
import { CreateOrganizationPayloadDto } from '../dto/CreateOrganizationPayloadDto';
import { UpdateOrganizationPayloadDto } from '../dto/UpdateOrganizationPayloadDto';
import { InviteMemberPayloadDto } from '../dto/InviteMemberPayloadDto';
import { UpdateMemberRolePayloadDto } from '../dto/UpdateMemberRolePayloadDto';
import { DuplicateEntityError } from '../../shared/error/DuplicateEntityError';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';
import { OrgRole } from '../../shared/enum/OrgRole';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    @InjectModel(Organization.name)
    private readonly orgModel: Model<OrganizationDocument>,
    @InjectModel(OrganizationMember.name)
    private readonly memberModel: Model<OrganizationMemberDocument>,
  ) {}

  async create(
    dto: CreateOrganizationPayloadDto,
    ownerId: string,
  ): Promise<Organization> {
    this.logger.log(`Creating organization with slug: ${dto.slug}`);

    const org = new this.orgModel({
      ...dto,
      ownerId: new Types.ObjectId(ownerId),
    });

    let savedOrg: OrganizationDocument;
    try {
      savedOrg = await org.save();
    } catch (error: unknown) {
      if ((error as { code?: number }).code === 11000) {
        throw new DuplicateEntityError(
          'Organization slug already exists',
          'Organization',
          '11000',
        );
      }
      throw error;
    }

    // Assign owner as member with Owner role
    const member = new this.memberModel({
      organizationId: savedOrg._id,
      userId: new Types.ObjectId(ownerId),
      role: OrgRole.Owner,
    });
    await member.save();

    this.logger.log(`Organization created successfully: ${savedOrg.id}`);
    return savedOrg;
  }

  async findById(id: string): Promise<Organization> {
    this.logger.debug(`Finding organization by id: ${id}`);
    const org = await this.orgModel.findById(id).exec();

    if (!org) {
      this.logger.warn(`Organization not found: ${id}`);
      throw new NotFoundEntityError('Organization not found', 'Organization', '404');
    }

    return org;
  }

  async update(id: string, dto: UpdateOrganizationPayloadDto): Promise<Organization> {
    this.logger.log(`Updating organization: ${id}`);
    const org = await this.orgModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();

    if (!org) {
      this.logger.warn(`Organization not found for update: ${id}`);
      throw new NotFoundEntityError('Organization not found', 'Organization', '404');
    }

    this.logger.log(`Organization updated successfully: ${id}`);
    return org;
  }

  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting organization: ${id}`);
    const result = await this.orgModel.findByIdAndDelete(id).exec();

    if (!result) {
      this.logger.warn(`Organization not found for deletion: ${id}`);
      throw new NotFoundEntityError('Organization not found', 'Organization', '404');
    }

    this.logger.log(`Organization deleted successfully: ${id}`);
  }

  async findMembers(organizationId: string): Promise<OrganizationMember[]> {
    this.logger.debug(`Finding members for organization: ${organizationId}`);
    return this.memberModel
      .find({ organizationId: new Types.ObjectId(organizationId) })
      .exec();
  }

  async inviteMember(
    organizationId: string,
    dto: InviteMemberPayloadDto,
  ): Promise<OrganizationMember> {
    this.logger.log(`Inviting member ${dto.userId} to organization: ${organizationId}`);

    const member = new this.memberModel({
      organizationId: new Types.ObjectId(organizationId),
      userId: new Types.ObjectId(dto.userId),
      role: dto.role,
    });

    try {
      return await member.save();
    } catch (error: unknown) {
      if ((error as { code?: number }).code === 11000) {
        throw new DuplicateEntityError(
          'User is already a member of this organization',
          'OrganizationMember',
          '11000',
        );
      }
      throw error;
    }
  }

  async updateMemberRole(
    organizationId: string,
    userId: string,
    dto: UpdateMemberRolePayloadDto,
  ): Promise<OrganizationMember> {
    this.logger.log(`Updating role for member ${userId} in organization: ${organizationId}`);

    const member = await this.memberModel
      .findOneAndUpdate(
        {
          organizationId: new Types.ObjectId(organizationId),
          userId: new Types.ObjectId(userId),
        },
        { $set: { role: dto.role } },
        { new: true },
      )
      .exec();

    if (!member) {
      this.logger.warn(`Member not found: userId=${userId}, orgId=${organizationId}`);
      throw new NotFoundEntityError(
        'Organization member not found',
        'OrganizationMember',
        '404',
      );
    }

    this.logger.log(`Member role updated successfully`);
    return member;
  }

  async removeMember(organizationId: string, userId: string): Promise<void> {
    this.logger.log(`Removing member ${userId} from organization: ${organizationId}`);

    const result = await this.memberModel
      .findOneAndDelete({
        organizationId: new Types.ObjectId(organizationId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (!result) {
      this.logger.warn(`Member not found for removal: userId=${userId}, orgId=${organizationId}`);
      throw new NotFoundEntityError(
        'Organization member not found',
        'OrganizationMember',
        '404',
      );
    }

    this.logger.log(`Member removed successfully`);
  }
}
