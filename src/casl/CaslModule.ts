// ABOUTME: CASL authorization module providing AbilityFactory, TenantGuard, and PoliciesGuard
// ABOUTME: Exports guards and factory for use in feature modules

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AbilityFactory } from './factory/AbilityFactory';
import { TenantGuard } from './guard/TenantGuard';
import { PoliciesGuard } from './guard/PoliciesGuard';
import {
  OrganizationMember,
  OrganizationMemberSchema,
} from '../organizations/schemas/OrganizationMemberSchema';

const OrganizationMemberMongooseModule = MongooseModule.forFeature([
  { name: OrganizationMember.name, schema: OrganizationMemberSchema },
]);

@Module({
  imports: [OrganizationMemberMongooseModule],
  providers: [AbilityFactory, TenantGuard, PoliciesGuard],
  exports: [AbilityFactory, TenantGuard, PoliciesGuard, OrganizationMemberMongooseModule],
})
export class CaslModule {}
