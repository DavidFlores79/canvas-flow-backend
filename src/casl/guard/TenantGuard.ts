// ABOUTME: Guard that validates org membership from JWT and attaches tenantContext to request
// ABOUTME: Must run after JwtAuthGuard. Throws ForbiddenException if user lacks org membership

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  OrganizationMember,
  OrganizationMemberDocument,
} from '../../organizations/schemas/OrganizationMemberSchema';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @InjectModel(OrganizationMember.name)
    private readonly memberModel: Model<OrganizationMemberDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: { sub: string; organizationId: string };
      tenantContext: OrganizationMember;
    }>();
    const { sub, organizationId } = request.user;

    if (!sub || !organizationId) {
      throw new ForbiddenException('Missing user or organization context');
    }

    const membership = await this.memberModel
      .findOne({
        userId: new Types.ObjectId(sub),
        organizationId: new Types.ObjectId(organizationId),
      })
      .lean()
      .exec();

    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    request.tenantContext = membership as OrganizationMember;
    return true;
  }
}
