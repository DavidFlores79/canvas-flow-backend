// ABOUTME: NestJS module bundling Project schema, service, and controller
// ABOUTME: Imports CaslModule for authorization guards; exports ProjectService for cross-module use

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Project, ProjectSchema } from './schemas/ProjectSchema';
import { ProjectService } from './service/ProjectService';
import { ProjectController } from './controller/ProjectController';
import { CaslModule } from '../casl/CaslModule';
import { LayersModule } from '../layers/LayersModule';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
    ]),
    CaslModule,
    LayersModule,
  ],
  providers: [ProjectService],
  controllers: [ProjectController],
  exports: [ProjectService],
})
export class ProjectsModule {}
