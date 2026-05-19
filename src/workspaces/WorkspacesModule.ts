// ABOUTME: NestJS module bundling Workspace schemas, service, and controller
// ABOUTME: Imports CaslModule for authorization guards

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Workspace, WorkspaceSchema } from './schemas/WorkspaceSchema';
import { WorkspaceMember, WorkspaceMemberSchema } from './schemas/WorkspaceMemberSchema';
import { WorkspaceService } from './service/WorkspaceService';
import { WorkspaceController } from './controller/WorkspaceController';
import { CaslModule } from '../casl/CaslModule';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: WorkspaceMember.name, schema: WorkspaceMemberSchema },
    ]),
    CaslModule,
  ],
  providers: [WorkspaceService],
  controllers: [WorkspaceController],
  exports: [WorkspaceService],
})
export class WorkspacesModule {}
