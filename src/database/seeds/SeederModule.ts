// ABOUTME: NestJS module for the standalone seeder application
// ABOUTME: Imports DatabaseModule and registers all schemas needed for seeding

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { DatabaseModule } from '../DatabaseModule';
import { User, UserSchema } from '../../users/schemas/UserSchema';
import { Organization, OrganizationSchema } from '../../organizations/schemas/OrganizationSchema';
import { OrganizationMember, OrganizationMemberSchema } from '../../organizations/schemas/OrganizationMemberSchema';
import { Workspace, WorkspaceSchema } from '../../workspaces/schemas/WorkspaceSchema';
import { WorkspaceMember, WorkspaceMemberSchema } from '../../workspaces/schemas/WorkspaceMemberSchema';

import { UserSeeder } from './seeders/UserSeeder';
import { OrganizationSeeder } from './seeders/OrganizationSeeder';
import { WorkspaceSeeder } from './seeders/WorkspaceSeeder';
import { SeederService } from './SeederService';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `environment/${process.env.DEPLOY_ENV}.env`,
        'environment/base.env',
      ],
    }),
    DatabaseModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: OrganizationMember.name, schema: OrganizationMemberSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: WorkspaceMember.name, schema: WorkspaceMemberSchema },
    ]),
  ],
  providers: [
    UserSeeder,
    OrganizationSeeder,
    WorkspaceSeeder,
    SeederService,
  ],
})
export class SeederModule {}
