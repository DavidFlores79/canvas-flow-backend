// ABOUTME: NestJS module bundling Organization schemas, service, and controller
// ABOUTME: Imports CaslModule for authorization guards

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Organization, OrganizationSchema } from './schemas/OrganizationSchema';
import { OrganizationMember, OrganizationMemberSchema } from './schemas/OrganizationMemberSchema';
import { OrganizationService } from './service/OrganizationService';
import { OrganizationController } from './controller/OrganizationController';
import { CaslModule } from '../casl/CaslModule';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: OrganizationMember.name, schema: OrganizationMemberSchema },
    ]),
    CaslModule,
  ],
  providers: [OrganizationService],
  controllers: [OrganizationController],
  exports: [OrganizationService],
})
export class OrganizationsModule {}
