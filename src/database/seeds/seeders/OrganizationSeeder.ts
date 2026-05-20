// ABOUTME: Seeds Paisamex and Luxfree organizations with owner memberships
// ABOUTME: Idempotent — checks by slug before inserting, skips if already exists

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Organization, OrganizationDocument } from '../../../organizations/schemas/OrganizationSchema';
import { OrganizationMember, OrganizationMemberDocument } from '../../../organizations/schemas/OrganizationMemberSchema';
import { OrgRole } from '../../../shared/enum/OrgRole';
import { SeedUserResult } from './UserSeeder';

export interface SeedOrganizationResult {
  paisamexOrg: OrganizationDocument;
  luxfreeOrg: OrganizationDocument;
}

@Injectable()
export class OrganizationSeeder {
  private readonly logger = new Logger(OrganizationSeeder.name);

  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
    @InjectModel(OrganizationMember.name)
    private readonly organizationMemberModel: Model<OrganizationMemberDocument>,
  ) {}

  async seed(users: SeedUserResult): Promise<SeedOrganizationResult> {
    const paisamexOrg = await this.seedOrganization(
      { name: 'Paisamex', slug: 'paisamex' },
      users.paisamexUser._id as Types.ObjectId,
    );

    const luxfreeOrg = await this.seedOrganization(
      { name: 'Luxfree', slug: 'luxfree' },
      users.luxfreeUser._id as Types.ObjectId,
    );

    // Also add paisamexUser as a member of Luxfree so the account belongs to both orgs
    await this.seedMembership(
      luxfreeOrg._id as Types.ObjectId,
      users.paisamexUser._id as Types.ObjectId,
    );

    return { paisamexOrg, luxfreeOrg };
  }

  private async seedOrganization(
    data: { name: string; slug: string },
    ownerId: Types.ObjectId,
  ): Promise<OrganizationDocument> {
    const existing = await this.organizationModel.findOne({ slug: data.slug }).exec();

    if (existing) {
      this.logger.log(`Organization already exists, skipping: ${data.slug}`);
      await this.seedMembership(existing._id as Types.ObjectId, ownerId);
      return existing;
    }

    const org = new this.organizationModel({
      name: data.name,
      slug: data.slug,
      ownerId,
    });

    const saved = await org.save();
    this.logger.log(`Created organization: ${data.slug}`);

    await this.seedMembership(saved._id as Types.ObjectId, ownerId);
    return saved;
  }

  private async seedMembership(
    organizationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<void> {
    const existing = await this.organizationMemberModel
      .findOne({ organizationId, userId })
      .exec();

    if (existing) {
      this.logger.log(`OrganizationMember already exists, skipping: org=${organizationId} user=${userId}`);
      return;
    }

    const member = new this.organizationMemberModel({
      organizationId,
      userId,
      role: OrgRole.Owner,
    });

    await member.save();
    this.logger.log(`Created OrganizationMember: org=${organizationId} user=${userId} role=${OrgRole.Owner}`);
  }
}
